import logo from '../assets/loguinho-removebg-preview.png';

export default function Logo({ pequeno = false }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className={`grid place-items-center rounded-xl bg-verde text-white ${pequeno ? 'h-9 w-9' : 'h-11 w-11'}`}>
        <img src={logo} alt="SkinConnect" className={pequeno ? 'h-9 w-9 object-contain' : 'h-10 w-10 object-contain'} />  
      </span>
      <span className="font-display text-[22px] font-medium">SkinConnect</span>
    </span>
  );
}
