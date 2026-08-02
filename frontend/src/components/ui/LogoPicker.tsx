import { useRef, useState } from 'react'
import { Image as ImageIcon, ImagePlus, X } from 'lucide-react'

interface LogoPickerProps {
  value?: string
  onChange: (value: string | undefined) => void
  size?: number
}

const MAX_SOURCE_BYTES = 5 * 1024 * 1024 // 5 Mo
const OUTPUT_SIZE = 256

function resizeToSquareJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image invalide'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = OUTPUT_SIZE
        canvas.height = OUTPUT_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas indisponible')); return }
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function LogoPicker({ value, onChange, size = 64 }: LogoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) { setError('Le fichier doit être une image'); return }
    if (file.size > MAX_SOURCE_BYTES) { setError('Image trop volumineuse (5 Mo max)'); return }
    try {
      const dataUrl = await resizeToSquareJpeg(file)
      onChange(dataUrl)
    } catch {
      setError("Impossible de traiter l'image")
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          background: 'var(--bg-2)', border: '1px solid var(--line-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {value ? (
          <img src={value} alt="Logo du projet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <ImageIcon size={Math.round(size * 0.4)} style={{ color: 'var(--fg-2)' }} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current?.click()}>
            <ImagePlus size={12} /> {value ? 'Changer le logo' : 'Ajouter un logo'}
          </button>
          {value && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(undefined)}>
              <X size={12} /> Retirer
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => void handleFile(e)} />
        {error && <span style={{ fontSize: 11, color: 'var(--bad)' }}>{error}</span>}
      </div>
    </div>
  )
}
