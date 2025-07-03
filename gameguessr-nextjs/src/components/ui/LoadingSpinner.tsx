interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner = ({ size = 'medium' }: LoadingSpinnerProps) => {
  const sizeClass = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }[size];

  return (
    <div className="flex justify-center items-center">
      <div className={`spinner ${sizeClass}`}>
        <div className="border-t-4 border-blue-500 rounded-full animate-spin" />
      </div>
      <span className="sr-only">Chargement...</span>
    </div>
  );
};

export default LoadingSpinner;
