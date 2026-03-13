interface Props {
  onConfirm: () => void
  className?: string
}

export default function ConfirmButton({ onConfirm, className }: Props) {
  const handleClick = () => {
    if (window.confirm('Удалить? Это действие необратимо.')) {
      onConfirm()
    }
  }
  return (
    <button
      onClick={handleClick}
      className={className ?? 'text-red-600 hover:text-red-800 text-sm'}
    >
      Удалить
    </button>
  )
}
