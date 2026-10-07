/* Script aplicado antes da primeira pintura: lê o tema salvo no
   navegador (localStorage) e, sem escolha, segue o sistema. Assim a
   página já abre no tema certo — sem piscar. */
const THEME_SCRIPT = `(function(){try{
var k='atelier-tema',s=localStorage.getItem(k);
var m=(s==='light'||s==='dark')?s:'system';
var t=m==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):m;
var r=document.documentElement;
r.dataset.theme=t;r.dataset.themeMode=m;
if(m!=='system'){r.style.colorScheme=m;}
}catch(e){}})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
