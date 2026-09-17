// ------------------------------------------------------------------
// src/context/AuthContext.jsx
// ------------------------------------------------------------------
// Autenticação via Firebase Auth (e-mail/senha) + perfil do funcionário
// logado (lido da coleção "funcionarios" pelo e-mail).
//
// Recursos:
//   - login(email, senha, remember) -> "Lembrar de mim" controla a
//     persistência (LOCAL = reabre logado; SESSION = fecha com a aba);
//   - register({ nome, email, password, whatsapp }) -> auto-cadastro:
//     cria a conta de Auth E o registro em `funcionarios` com acesso
//     Operacional/Ativo/Externo, com login automático na sequência;
//   - resetPassword(email) -> envia e-mail de redefinição de senha;
//   - userProfile -> funcionário logado (setor/nível de acesso).
//
// Obs. de segurança: dados (rules) do Firestore precisam permitir que
// um novo usuário crie SEU próprio registro em `funcionarios`.
// ------------------------------------------------------------------
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/config/firebase'
import {
  getFuncionarioByEmail,
  createFuncionario,
} from '@/services/funcionarioService'

const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  profileLoading: false,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
})

/** Traduz códigos de erro do Firebase Auth para mensagens amigáveis. */
function friendlyAuthError(error) {
  const code = error?.code ?? ''
  if (code === 'auth/email-already-in-use') {
    return 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.'
  }
  if (code === 'auth/weak-password') {
    return 'Senha muito fraca. Use pelo menos 8 caracteres, com letras e números.'
  }
  if (code === 'auth/invalid-email') {
    return 'Informe um e-mail válido.'
  }
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'E-mail ou senha inválidos.'
  }
  if (code === 'auth/too-many-requests') {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  }
  if (code === 'auth/network-request-failed') {
    return 'Sem conexão com a internet. Verifique sua rede.'
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true) // verificação inicial do Auth
  const [profileLoading, setProfileLoading] = useState(false)

  // Contador para evitar que uma resposta antiga de perfil (raça do
  // onAuthStateChanged) sobrescreva uma resposta mais nova.
  const profileReqId = useRef(0)

  /** Busca o perfil (funcionarios) do usuário e aplica se for a requisição mais nova. */
  const refreshProfile = useCallback(async (email) => {
    const id = ++profileReqId.current
    setProfileLoading(true)
    try {
      const profile = await getFuncionarioByEmail(email)
      if (profileReqId.current === id) {
        setUserProfile(profile)
        setProfileLoading(false)
      }
    } catch {
      if (profileReqId.current === id) {
        setUserProfile(null)
        setProfileLoading(false)
      }
    }
  }, [])

  // Observa o estado de login do Firebase Auth
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (fireUser) => {
      setUser(fireUser)
      if (fireUser) {
        await refreshProfile(fireUser.email)
      } else {
        profileReqId.current++ // invalida buscas pendentes
        setUserProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [refreshProfile])

  /** Login com controle de persistência ("Lembrar de mim"). */
  const login = useCallback(async (email, password, remember = false) => {
    try {
      if (remember) {
        await setPersistence(auth, browserLocalPersistence)
      } else {
        await setPersistence(auth, browserSessionPersistence)
      }
      await signInWithEmailAndPassword(auth, email, password)
      // O onAuthStateChanged atualiza user/userProfile automaticamente
    } catch (err) {
      throw new Error(friendlyAuthError(err))
    }
  }, [])

  /**
   * Auto-cadastro: cria a conta de Auth + registro em `funcionarios`
   * (acesso padrão Operacional/Ativo/Externo) e conclui o login.
   *
   * @param {{ nome: string, email: string, password: string, whatsapp?: string }} dados
   */
  const register = useCallback(async ({ nome, email, password, whatsapp }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      // Cria o registro do funcionário vinculado ao UID da nova conta
      await createFuncionario(
        {
          nome,
          email,
          whatsapp: whatsapp ?? '',
          escolaridade: 'Ensino médio', // padrão, preenchível depois
          setor: 'Operacional',
          status: 'Ativo',
          nivelAcesso: 'Externo',
        },
        cred.user.uid
      )
      // Login automático: assegura o perfil mesmo com a raça do listener
      await refreshProfile(email)
    } catch (err) {
      throw new Error(friendlyAuthError(err))
    }
  }, [refreshProfile])

  /** Envia e-mail de redefinição de senha. */
  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err) {
      const code = err?.code ?? ''
      if (code === 'auth/user-not-found') {
        // Não revelar se o e-mail existe é mais seguro; genérico:
        throw new Error('Se este e-mail estiver cadastrado, você receberá o link de redefinição.')
      }
      if (code === 'auth/invalid-email') {
        throw new Error('Informe um e-mail válido.')
      }
      throw new Error('Não foi possível enviar o e-mail. Tente novamente.')
    }
  }, [])

  /** Encerra a sessão. */
  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  // Acesso administrativo: setor Administrativo OU nível de acesso Total
  const isAdmin =
    userProfile?.setor === 'Administrativo' || userProfile?.nivelAcesso === 'Total'

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        profileLoading,
        isAdmin,
        login,
        register,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/** Hook de acesso à autenticação/perfil. */
export function useAuth() {
  return useContext(AuthContext)
}