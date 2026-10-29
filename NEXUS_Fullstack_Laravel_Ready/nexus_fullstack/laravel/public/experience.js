/* Progressive enhancement only. All gameplay remains usable without this file. */
(() => {
  const progress = document.getElementById('readingProgress');
  const updateProgress = () => {
    if (!progress) return;
    const available = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    progress.style.width = `${Math.min(100, Math.max(0, scrollY / available * 100))}%`;
  };
  window.addEventListener('scroll', updateProgress, {passive:true});
  window.addEventListener('resize', updateProgress, {passive:true});
  updateProgress();
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const items = document.querySelectorAll('.section-heading,.game-card,.notice');
    const io = new IntersectionObserver(entries => entries.forEach(entry => {if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}}),{threshold:.08,rootMargin:'0px 0px 60px 0px'});
    items.forEach((item,index)=> {item.dataset.reveal=''; item.style.transitionDelay=`${index % 5 * 65}ms`;io.observe(item);});
  }
  const globe = document.querySelector('.art-globe');
  const art = document.querySelector('.hero-art');
  if (globe && art && !prefersReduced && matchMedia('(pointer:fine)').matches) {
    art.addEventListener('pointermove', e => {const rect=art.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width-.5,y=(e.clientY-rect.top)/rect.height-.5;globe.style.transform=`translate(calc(-50% + ${x*9}px),calc(-50% + ${y*9}px)) rotate(${x*2}deg)`;});
    art.addEventListener('pointerleave',()=>{globe.style.transform='translate(-50%,-50%)';});
  }
})();
