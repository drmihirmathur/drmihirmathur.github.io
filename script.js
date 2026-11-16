// Keep navigation available if JavaScript is disabled.
document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-button');
const nav = document.getElementById('site-nav');
const header = document.querySelector('.header');

// Use the rendered header height so anchors stay visible after resizing or zooming.
const updateHeaderOffset = () => {
  if (header) {
    document.documentElement.style.setProperty('--header-offset', `${header.getBoundingClientRect().height}px`);
  }
};
updateHeaderOffset();
if (header && 'ResizeObserver' in window) {
  new ResizeObserver(updateHeaderOffset).observe(header);
} else {
  window.addEventListener('resize', updateHeaderOffset);
}

if (menuButton && nav) {
  menuButton.hidden = false;
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('is-open');
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('is-open', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !menuButton.contains(e.target)) closeMenu();
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', closeMenu);
}

if (nav) {
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => ({
    hash: link.hash,
    element: document.getElementById(link.hash.slice(1))
  })).filter(section => section.element);
  let navigating = false;
  let settleTimer;
  let framePending = false;

  const setCurrentLink = hash => {
    links.forEach(link => {
      if (link.hash === hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const updateCurrentSection = () => {
    if (navigating) return;
    const activationLine = (header?.getBoundingClientRect().height || 0) + 24;
    let current = null;
    sections.forEach(section => {
      if (section.element.getBoundingClientRect().top <= activationLine) current = section.hash;
    });
    if (window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2) {
      current = sections.at(-1)?.hash;
    }
    setCurrentLink(current);
  };

  const requestUpdate = () => {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => {
      framePending = false;
      updateCurrentSection();
    });
  };

  const finishNavigation = () => {
    clearTimeout(settleTimer);
    navigating = false;
    requestUpdate();
  };

  const waitForScroll = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(finishNavigation, 180);
  };

  const selectDestination = hash => {
    if (!sections.some(section => section.hash === hash)) {
      finishNavigation();
      return;
    }
    setCurrentLink(hash);
    navigating = true;
    waitForScroll();
  };

  links.forEach(link => link.addEventListener('click', event => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
      selectDestination(link.hash);
    }
  }));
  window.addEventListener('hashchange', () => selectDestination(window.location.hash));
  window.addEventListener('scroll', () => {
    if (navigating) waitForScroll();
    else requestUpdate();
  }, { passive: true });
  window.addEventListener('wheel', finishNavigation, { passive: true });
  window.addEventListener('touchstart', finishNavigation, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) finishNavigation();
  });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('pageshow', requestUpdate);
  if (window.location.hash) selectDestination(window.location.hash);
  else requestUpdate();
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
