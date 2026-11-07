// Foto, nombre y ciudad del usuario
export default function EncabezadoPerfil({ perfil }) {
  const inicial = perfil.nombre?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="flex flex-col items-center text-center gap-2">
      {perfil.foto_url ? (
        <img
          src={perfil.foto_url}
          alt={perfil.nombre}
          className="w-24 h-24 rounded-full object-cover border-2 border-menta"
        />
      ) : (
        // Sin foto: círculo con la inicial
        <div className="w-24 h-24 rounded-full border-2 border-menta flex items-center justify-center font-titulos text-4xl text-menta">
          {inicial}
        </div>
      )}
      <h1 className="font-titulos font-bold text-2xl text-menta uppercase">{perfil.nombre}</h1>
      <p className="text-xs text-suave tracking-widest uppercase">{perfil.ciudad}</p>
    </div>
  )
}
