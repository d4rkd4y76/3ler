(function(){
  function mountStrictlyInside(sc){
    const nova=document.getElementById('nova-summary');
    if(!nova || !sc) return;
    if (nova.parentElement === sc) {
      sc.classList.add('nova-final-wrap');
      return;
    }
    try {
      if (nova.parentElement) nova.parentElement.removeChild(nova);
    } catch (_) {}
    sc.appendChild(nova);
    sc.classList.add('nova-final-wrap');
  }

  function observeAndMount(){
    const sc=document.querySelector('.score-container, #score-container');
    if(!sc) return;
    const once=()=>{
      mountStrictlyInside(sc);
    };
    const visible=(getComputedStyle(sc).display!=='none' && sc.offsetParent!==null) || sc.classList.contains('show') || sc.classList.contains('active');
    if(visible) once();
    const obs=new MutationObserver(()=>{
      const vis=(getComputedStyle(sc).display!=='none' && sc.offsetParent!==null) || sc.classList.contains('show') || sc.classList.contains('active');
      if(vis) once();
    });
    obs.observe(sc,{attributes:true,attributeFilter:['style','class']});
  }
  window.addEventListener('DOMContentLoaded', observeAndMount);
})();
