// ------------------------------------------------------------------
// src/context/AuthContext.jsx
// ------------------------------------------------------------------
// Autenticação via Firebase Auth (e-mail/senha) + perfil do funcionário
// logado (lido pelo UID) e papel administrativo seedado em roles/{uid}.
//
// Recursos:
//   - login(email, senha, remember) -> "Lembrar de mim" controla a
//     persistência (LOCAL = reabre logado; SESSION = fecha com a aba);
//   - register({ nome, email, password, whatsapp, inviteToken }) -> cria
//     Auth somente após validar convite e o consome vinculando UID existente;
//   - resetPassword(email) -> envia e-mail de redefinição de senha;
//   - userProfile -> funcionário logado (setor/nível de acesso).
// ------------------------------------------------------------------
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/config/firebase'
import {
  getFuncionarioByUid,
  getUserRole,
  validateFuncionarioInvite,
  claimFuncionarioInvite,
} from '@/services/funcionarioService'

const AuthContext = createContext({
  user: null,
  userProfile: null,
  profileError: null,
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

function registrationError(error) {
  if (error?.code) return friendlyAuthError(error)
  return error?.message || 'Não foi possível concluir o cadastro.'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true) // verificação inicial do Auth
  const [profileLoading, setProfileLoading] = useState(false)

  // Contador para evitar que uma resposta antiga de perfil (raça do
  // onAuthStateChanged) sobrescreva uma resposta mais nova.
  const profileReqId = useRef(0)
  const roleReqId = useRef(0)

  /** Busca o perfil do funcionário autenticado pelo UID, sem consulta pública por e-mail. */
  const refreshProfile = useCallback(async (uid) => {
    const id = ++profileReqId.current
    setProfileLoading(true)
    setProfileError(null)
    try {
      const profile = await getFuncionarioByUid(uid)
      if (profileReqId.current === id) {
        setUserProfile(profile)
        setProfileLoading(false)
      }
    } catch (error) {
      if (profileReqId.current === id) {
        setUserProfile(null)
        setProfileError(
          error?.code === 'profile/ambiguous'
            ? error.message
            : 'Não foi possível carregar o perfil do funcionário.'
        )
        setProfileLoading(false)
      }
    }
  }, [])

  const refreshRole = useCallback(async (uid) => {
    const id = ++roleReqId.current
    setUserRole(null)
    try {
      const role = await getUserRole(uid)
      if (roleReqId.current === id) setUserRole(role)
    } catch {
      // Uma falha de leitura nunca concede acesso administrativo.
      if (roleReqId.current === id) setUserRole(null)
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
        await Promise.all([refreshProfile(fireUser.uid), refreshRole(fireUser.uid)])
      } else {
        profileReqId.current++ // invalida buscas pendentes
        roleReqId.current++
        setUserProfile(null)
        setProfileError(null)
        setUserRole(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [refreshProfile, refreshRole])

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
   * Cadastra somente com convite válido. Se a associação falhar, tenta
   * remover a conta Auth recém-criada; erros de compensação são informados.
   *
   * @param {{ nome: string, email: string, password: string, whatsapp?: string, inviteToken?: string }} dados
   */
  const register = useCallback(async ({ nome, email, password, whatsapp, inviteToken }) => {
    let cred = null
    try {
      const token =
        inviteToken ||
        (typeof window !== 'undefined'
          ? (
            new URLSearchParams(window.location.hash.slice(1)).get('convite') ||
            new URLSearchParams(window.location.search).get('convite')
          )
          : '')
      if (!token) throw new Error('É necessário um convite válido para criar uma conta.')

      const normalizedEmail = String(email ?? '').trim().toLowerCase()
      await validateFuncionarioInvite(token, normalizedEmail)
      cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      await claimFuncionarioInvite(token, cred.user)
      await Promise.all([refreshProfile(cred.user.uid), refreshRole(cred.user.uid)])
    } catch (err) {
      if (!cred) throw new Error(registrationError(err))

      // Uma resposta de rede pode ser ambígua após o commit. Só considerar
      // sucesso se a leitura pelo UID confirmar que a transação foi concluída.
      let linkedProfile
      try {
        linkedProfile = await getFuncionarioByUid(cred.user.uid)
      } catch {
        await signOut(auth).catch(() => {})
        throw new Error(
          'Não foi possível confirmar o vínculo do convite. A conta foi criada, mas o estado do vínculo é incerto; contate a administração antes de tentar novamente.'
        )
      }
      if (linkedProfile) {
        await Promise.all([refreshProfile(cred.user.uid), refreshRole(cred.user.uid)])
        return
      }

      try {
        await deleteUser(cred.user)
        await signOut(auth).catch(() => {})
      } catch {
        await signOut(auth).catch(() => {})
        throw new Error(
          'Não foi possível vincular o convite e a conta recém-criada não pôde ser removida automaticamente. Contate a administração para regularizar o acesso.'
        )
      }
      throw new Error(registrationError(err))
    }
  }, [refreshProfile, refreshRole])

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

  // Autorização administrativa vem exclusivamente de roles/{uid}, seed externo.
  const isAdmin = userRole?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        profileError,
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