import { animateOut, animateIn } from "./reuseableAnimations.js";

async function fetchPage(urlToFetch, elementToUpdate, animationClass) {
    try {
        const res = await fetch(urlToFetch, {
          headers: {
            // added header to indicate ajax request coming from internal fetch
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        if (!res.ok) throw new Error(`Failed to load ${urlToFetch}`);

        // Fade out
        await animateOut(elementToUpdate, animationClass);
        
        const html = await res.text();

        // Swap the main content
        elementToUpdate.innerHTML = html;

        // Fade back in
        await animateIn(elementToUpdate, animationClass);
    } catch (err) {
        console.error(err);
        elementToUpdate.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'error';
        p.textContent = `Failed to load page: ${urlToFetch}`;
        elementToUpdate.appendChild(p);
    }
}

export {fetchPage};