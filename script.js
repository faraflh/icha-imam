document.addEventListener("DOMContentLoaded", function () {
  const btnBuka = document.getElementById("btnBuka");
  const frontPage = document.getElementById("frontPage");
  const mobilePage = document.querySelector(".mobile-page");
  const audio = document.getElementById("wedding-audio");
  const musicToggle = document.getElementById("musicToggle");
  const mainContent = document.getElementById("mainContent");
  const scrollProgress = document.getElementById("scrollProgress");

  // ===============================
  // Read URL Parameter (?to=Name)
  // ===============================
  const urlParams = new URLSearchParams(window.location.search);
  const guestParam = urlParams.get("to");
  if (guestParam) {
    document.getElementById("guestName").innerText =
      decodeURIComponent(guestParam);
  }

  // ===============================
  // Unlock Invitation Event
  // ===============================
  btnBuka.addEventListener("click", function () {
    // 1. Play Background Music
    if (audio) {
      audio.play().catch((err) => console.log("Audio play blocked:", err));
    }

    // 2. Add slide-up exit animation
    frontPage.classList.add("page-exit");

    // 3. Unlock page scrolling & trigger hero entrance animations
    mobilePage.classList.remove("is-locked");
    mobilePage.classList.add("is-opened"); // <-- Add this line

    // 4. Reveal floating music control
    if (musicToggle) musicToggle.hidden = false;

    // 5. Hide cover element completely after animation finishes (0.8s)
    setTimeout(() => {
      frontPage.style.display = "none";
    }, 800);
  });

  const bg = new Image();
  bg.src = "assets/background.webp";

  bg.onload = () => {
    setTimeout(() => {
      document.querySelector(".front-page").classList.add("loaded");
    }, 1000);
  };

  // ===============================
  // Floating music toggle
  // ===============================
  if (musicToggle && audio) {
    musicToggle.addEventListener("click", function () {
      if (audio.paused) {
        audio.play().catch(() => {});
        musicToggle.classList.remove("is-paused");
      } else {
        audio.pause();
        musicToggle.classList.add("is-paused");
      }
    });
  }

  // ===============================
  // Scroll reveal animations
  // ===============================
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" },
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback: reveal everything immediately
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  // ===============================
  // Scroll progress thread
  // ===============================
  if (scrollProgress) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          scrollProgress.style.width = pct + "%";
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ===============================
  // Wedding gift: copy account number
  // ===============================
  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(value);
      } catch (err) {
        // Fallback for browsers without Clipboard API support
        const tmp = document.createElement("textarea");
        tmp.value = value;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        document.body.removeChild(tmp);
      }
      const original = btn.innerHTML;
      btn.classList.add("is-copied");
      btn.innerHTML = "Tersalin";
      setTimeout(() => {
        btn.classList.remove("is-copied");
        btn.innerHTML = original;
      }, 1800);
    });
  });

  // ===============================
  // RSVP & Wishes
  // Stored in Supabase. Fill in the two values below from:
  // Supabase Dashboard > Project Settings > API
  // ===============================
  const SUPABASE_URL = "https://xbfmhxlcqltzeslaffkv.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_66IpYLJdyyGTy6h8PirHXw_lzEwMMlf";
  const RSVP_TABLE = "rsvps";
  const rsvpForm = document.getElementById("rsvpForm");
  const wishesList = document.getElementById("wishesList");
  const submitButton = rsvpForm ? rsvpForm.querySelector(".btn-submit") : null;
  const hasSupabaseConfig =
    SUPABASE_URL.includes(".supabase.co") &&
    !SUPABASE_URL.includes("YOUR_PROJECT_REF") &&
    SUPABASE_PUBLISHABLE_KEY !== "YOUR_SUPABASE_PUBLISHABLE_KEY" &&
    window.supabase;
  const rsvpDb = hasSupabaseConfig
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null;

  async function loadWishes() {
    if (!rsvpDb) return [];

    const { data, error } = await rsvpDb
      .from(RSVP_TABLE)
      .select("name,status,message,created_at")
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  function statusClass(status) {
    return status.toLowerCase().replace(/\s+/g, "-");
  }

  async function renderWishes() {
    if (!wishesList) return;

    if (!rsvpDb) {
      wishesList.innerHTML =
        '<p class="wishes-empty">RSVP belum terhubung ke Supabase.</p>';
      return;
    }

    wishesList.innerHTML =
      '<p class="wishes-empty">Memuat ucapan dan doa...</p>';

    let wishes = [];
    try {
      wishes = await loadWishes();
    } catch (err) {
      console.error("Unable to load RSVP wishes:", err);
      wishesList.innerHTML =
        '<p class="wishes-empty">Ucapan belum bisa dimuat. Silakan coba beberapa saat lagi.</p>';
      return;
    }

    if (wishes.length === 0) {
      wishesList.innerHTML =
        '<p class="wishes-empty">Jadilah yang pertama mengirimkan ucapan dan doa 🤍</p>';
      return;
    }

    wishesList.innerHTML = wishes
      .map(
        (w) => `
        <div class="wish-item">
          <div class="wish-head">
            <span class="wish-name">${escapeHtml(w.name)}</span>
            <span class="wish-status ${statusClass(w.status)}">${escapeHtml(
              w.status,
            )}</span>
          </div>
          <p class="wish-message">${escapeHtml(w.message)}</p>
        </div>
      `,
      )
      .join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  if (rsvpForm) {
    rsvpForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("rsvpName").value.trim();
      const status = document.getElementById("rsvpStatus").value;
      const message = document.getElementById("rsvpMessage").value.trim();

      if (!name || !status || !message) return;
      if (!rsvpDb) {
        alert("RSVP belum terhubung ke Supabase.");
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Mengirim...";
      }

      const { error } = await rsvpDb.from(RSVP_TABLE).insert([
        {
          name,
          status,
          message,
        },
      ]);

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Kirim";
      }

      if (error) {
        console.error("Unable to submit RSVP:", error);
        alert("Maaf, RSVP belum berhasil terkirim. Silakan coba lagi.");
        return;
      }

      rsvpForm.reset();
      renderWishes();
    });
  }

  renderWishes();
  
  const lottieScript = document.createElement("script");
  lottieScript.src =
    "https://unpkg.com/@lottiefiles/dotlottie-wc@latest/dist/dotlottie-wc.js";
  lottieScript.type = "module";
  document.head.appendChild(lottieScript);
});

document.addEventListener("DOMContentLoaded", function () {
  const track = document.getElementById("galleryTrack");
  const items = track ? Array.from(track.querySelectorAll(".gallery-item")) : [];
  const galleryPrev = document.getElementById("galleryPrev");
  const galleryNext = document.getElementById("galleryNext");
  const lightbox = document.getElementById("lightbox");
  const lightboxContent = document.getElementById("lightboxContent");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  if (!track || !items.length) return;

  const photos = items
    .map((item, index) => {
      const image = item.querySelector("img");
      item.dataset.index = String(index);
      item.setAttribute("aria-label", image ? `Buka ${image.alt}` : "Buka foto");
      return image
        ? {
            src: image.currentSrc || image.src,
            alt: image.alt || `Foto ${index + 1}`,
          }
        : null;
    })
    .filter(Boolean);

  let currentIndex = 0;
  let lightboxIndex = 0;
  let autoSlideTimer = null;
  let scrollRaf = null;
  let resumeTimer = null;
  let isLightboxOpen = false;

  function normalizeIndex(index) {
    return (index + photos.length) % photos.length;
  }

  function setActiveItem(index) {
    currentIndex = normalizeIndex(index);
    items.forEach((item, itemIndex) => {
      const isActive = itemIndex === currentIndex;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-current", isActive ? "true" : "false");
      item.tabIndex = isActive ? 0 : -1;
    });
  }

  function scrollToItem(index, behavior = "smooth") {
    const nextIndex = normalizeIndex(index);
    const item = items[nextIndex];
    if (!item) return;

    setActiveItem(nextIndex);

    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const targetLeft = itemCenter - track.clientWidth / 2;

    track.scrollTo({
      left: targetLeft,
      behavior,
    });
  }

  function updateActiveFromScroll() {
    const trackRect = track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    let closestIndex = currentIndex;
    let closestDistance = Infinity;

    items.forEach((item, index) => {
      const itemRect = item.getBoundingClientRect();
      const itemCenter = itemRect.left + itemRect.width / 2;
      const distance = Math.abs(trackCenter - itemCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveItem(closestIndex);
  }

  function queueScrollUpdate() {
    if (scrollRaf) return;

    scrollRaf = window.requestAnimationFrame(() => {
      updateActiveFromScroll();
      scrollRaf = null;
    });
  }

  function stopAutoSlide() {
    window.clearInterval(autoSlideTimer);
    autoSlideTimer = null;
    window.clearTimeout(resumeTimer);
    resumeTimer = null;
  }

  function startAutoSlide() {
    stopAutoSlide();
    if (isLightboxOpen || photos.length < 2) return;

    autoSlideTimer = window.setInterval(() => {
      scrollToItem(currentIndex + 1);
    }, 3600);
  }

  function scheduleAutoSlide() {
    stopAutoSlide();
    if (isLightboxOpen) return;

    resumeTimer = window.setTimeout(startAutoSlide, 2500);
  }

  function showPrevious() {
    scrollToItem(currentIndex - 1);
    scheduleAutoSlide();
  }

  function showNext() {
    scrollToItem(currentIndex + 1);
    scheduleAutoSlide();
  }

  function renderLightbox() {
    if (!lightboxContent || !photos[lightboxIndex]) return;

    lightboxContent.replaceChildren();
    const image = document.createElement("img");
    image.className = "lightbox-img-pop";
    image.src = photos[lightboxIndex].src;
    image.alt = photos[lightboxIndex].alt;
    lightboxContent.appendChild(image);
  }

  function openLightbox(index) {
    isLightboxOpen = true;
    lightboxIndex = normalizeIndex(index);
    stopAutoSlide();
    renderLightbox();

    if (lightbox) {
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    }

    document.body.style.overflow = "hidden";
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    isLightboxOpen = false;

    if (lightbox) {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
    }

    document.body.style.overflow = "";
    scrollToItem(lightboxIndex, "auto");
    startAutoSlide();
  }

  function showLightboxPhoto(direction) {
    lightboxIndex = normalizeIndex(lightboxIndex + direction);
    renderLightbox();
  }

  items.forEach((item, index) => {
    item.addEventListener("click", () => {
      if (index === currentIndex) {
        openLightbox(index);
        return;
      }

      scrollToItem(index);
      scheduleAutoSlide();
    });
  });

  track.addEventListener("scroll", queueScrollUpdate, { passive: true });
  track.addEventListener("touchstart", stopAutoSlide, { passive: true });
  track.addEventListener("touchend", scheduleAutoSlide, { passive: true });
  track.addEventListener("pointerdown", stopAutoSlide);
  track.addEventListener("pointerup", scheduleAutoSlide);
  track.addEventListener("mouseenter", stopAutoSlide);
  track.addEventListener("mouseleave", startAutoSlide);

  if (galleryPrev) galleryPrev.addEventListener("click", showPrevious);
  if (galleryNext) galleryNext.addEventListener("click", showNext);
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      showLightboxPhoto(-1);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener("click", (e) => {
      e.stopPropagation();
      showLightboxPhoto(1);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (lightbox && lightbox.classList.contains("is-open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showLightboxPhoto(-1);
      if (e.key === "ArrowRight") showLightboxPhoto(1);
      return;
    }

    if (document.activeElement && track.contains(document.activeElement)) {
      if (e.key === "ArrowLeft") showPrevious();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(currentIndex);
      }
    }
  });

  setActiveItem(0);
  window.setTimeout(() => scrollToItem(0, "auto"), 80);
  startAutoSlide();
});
