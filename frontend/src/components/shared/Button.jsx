import s from './Button.module.css';
export default function Button({ children, variant='primary', size='md', loading, icon, ...props }) {
  return (
    <button className={[s.btn, s[variant], s[size], loading?s.loading:''].join(' ')} disabled={loading||props.disabled} {...props}>
      {loading && <span className={s.spinner}/>}
      {icon && !loading && <span className={s.icon}>{icon}</span>}
      {children}
    </button>
  );
}
