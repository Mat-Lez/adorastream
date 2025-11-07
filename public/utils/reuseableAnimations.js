async function animateOut(element, animationClass, animationDuration = 250) {
  element.classList.add(animationClass);
  await new Promise(resolve => {
    setTimeout(resolve, animationDuration);
  });
}

async function animateIn(element, animationClass, animationDuration = 250) {
  requestAnimationFrame(() => {
    element.classList.remove(animationClass);
  });
  await new Promise(resolve => {
    setTimeout(resolve, animationDuration);
  });
}

export { animateOut, animateIn };