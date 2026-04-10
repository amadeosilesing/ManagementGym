'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { useSession } from '@/lib/auth/client-session'

interface Usuario {
  id:       string
  nombre:   string
  email:    string
  rol:      'admin' | 'recepcionista'
  activo:   boolean
  creadoEn: string
}

interface FormData {
  nombre:   string
  email:    string
  password: string
  rol:      'admin' | 'recepcionista'
}

const formInicial: FormData = {
  nombre:   '',
  email:    '',
  password: '',
  rol:      'recepcionista',
}

export default function UsuariosPage() {
  const { session }                     = useSession()
  const [usuarios,     setUsuarios]     = useState<Usuario[]>([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState(false)
  const [form,         setForm]         = useState<FormData>(formInicial)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [editId,       setEditId]       = useState<string | null>(null)
  const [resetId,      setResetId]      = useState<string | null>(null)
  const [newPassword,  setNewPassword]  = useState('')
  const [resetSaving,  setResetSaving]  = useState(false)
  const [resetError,   setResetError]   = useState('')

  async function fetchUsuarios() {
    setLoading(true)
    try {
      const res  = await fetch('/api/usuarios')
      const data = await res.json()
      setUsuarios(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsuarios() }, [])

  function abrirNuevo() {
    setEditId(null)
    setForm(formInicial)
    setError('')
    setModal(true)
  }

  function abrirEditar(u: Usuario) {
    setEditId(u.id)
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol })
    setError('')
    setModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = editId
        ? await fetch(`/api/usuarios/${editId}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              nombre: form.nombre,
              rol:    form.rol,
            }),
          })
        : await fetch('/api/usuarios', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(form),
          })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Error al guardar')
        return
      }

      setModal(false)
      await fetchUsuarios()

    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(u: Usuario) {
    if (u.id === session?.id) {
      alert('No puedes desactivarte a ti mismo')
      return
    }
    const accion = u.activo ? 'desactivar' : 'activar'
    if (!confirm(`¿${accion} a ${u.nombre}?`)) return

    try {
      await fetch(`/api/usuarios/${u.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ activo: !u.activo }),
      })
      await fetchUsuarios()
    } catch {
      alert('Error al actualizar usuario')
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setResetSaving(true)
    setResetError('')

    try {
      const res = await fetch(`/api/usuarios/${resetId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: newPassword }),
      })

      const result = await res.json()

      if (!res.ok) {
        setResetError(result.error || 'Error al cambiar contraseña')
        return
      }

      setResetId(null)
      setNewPassword('')

    } catch {
      setResetError('Error de conexión')
    } finally {
      setResetSaving(false)
    }
  }

  const inputClass = `w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm
    text-gray-900 bg-white placeholder:text-gray-400
    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
    transition-colors`

  return (
    <>
      <Header titulo="Usuarios" subtitulo="Gestión del staff del gimnasio">
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#185FA5] hover:bg-[#0C447C]
                     text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo usuario
        </button>
      </Header>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Usuario</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Rol</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Creado</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No hay usuarios registrados</td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                      text-xs font-semibold shrink-0
                                      ${u.rol === 'admin'
                                        ? 'bg-purple-50 text-purple-600'
                                        : 'bg-[#E6F1FB] text-[#185FA5]'
                                      }`}>
                        {u.nombre[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{u.nombre}</p>
                          {u.id === session?.id && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">
                              Tú
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                      ${u.rol === 'admin'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-blue-50 text-blue-700'
                      }`}>
                      {u.rol === 'admin' ? 'Admin' : 'Recepcionista'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
                      ${u.activo
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-sm">
                    {new Date(u.creadoEn).toLocaleDateString('es-BO', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setResetId(u.id); setNewPassword(''); setResetError('') }}
                        className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200
                                   rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Cambiar contraseña
                      </button>
                      <button
                        onClick={() => abrirEditar(u)}
                        className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200
                                   rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggle(u)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer
                          ${u.activo
                            ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                            : 'text-green-600 border-green-200 hover:bg-green-50'
                          }`}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && setModal(false)}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">
                {editId ? 'Editar usuario' : 'Nuevo usuario'}
              </h2>
              <button onClick={() => setModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Juan Pérez"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className={inputClass}
                />
              </div>

              {!editId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="juan@gimnasio.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}

              {!editId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as 'admin' | 'recepcionista' })}
                  className={inputClass}
                >
                  <option value="recepcionista">Recepcionista</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl
                             hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#185FA5]
                             hover:bg-[#0C447C] disabled:bg-blue-300 rounded-xl transition-colors cursor-pointer">
                  {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {resetId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={(e) => e.target === e.currentTarget && setResetId(null)}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-sm">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Cambiar contraseña</h2>
              <button onClick={() => setResetId(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Nueva contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              {resetError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{resetError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setResetId(null)}
                  className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl
                             hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={resetSaving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#185FA5]
                             hover:bg-[#0C447C] disabled:bg-blue-300 rounded-xl transition-colors cursor-pointer">
                  {resetSaving ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}