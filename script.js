document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const preloader = document.getElementById("preloader");
  const loaderBarFill = document.querySelector(".loader-bar-fill");
  const wrapper = document.querySelector(".slides-wrapper");
  const slides = document.querySelectorAll(".slide");
  const navDotsContainer = document.querySelector(".nav-dots");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const currentSlideNum = document.getElementById("current-slide");
  const totalSlidesNum = document.getElementById("total-slides");
  const progressBar = document.querySelector(".progress-bar");

  // Presentation State
  let activeIndex = 0;
  const totalSlides = slides.length;
  let isTransitioning = false;
  let touchStartY = 0;
  let touchEndY = 0;

  // Initialize total slide count UI
  if (totalSlidesNum) {
    totalSlidesNum.textContent = String(totalSlides).padStart(2, "0");
  }

  // Dual Navigation Mode Detection
  function isMobileLayout() {
    return window.innerWidth <= 768;
  }

  // Create Navigation Dots dynamically
  function createNavDots() {
    navDotsContainer.innerHTML = "";
    slides.forEach((slide, index) => {
      const dot = document.createElement("button");
      dot.className = `nav-dot ${index === 0 ? "active" : ""}`;
      dot.setAttribute("aria-label", `Go to slide ${index + 1}`);

      const tooltip = document.createElement("span");
      tooltip.className = "nav-dot-tooltip";

      // Get slide title or default text for tooltip
      const slideTitle =
        slide.querySelector(".slide-title")?.textContent ||
        `Slide ${index + 1}`;
      tooltip.textContent =
        slideTitle.length > 30
          ? slideTitle.substring(0, 30) + "..."
          : slideTitle;

      dot.appendChild(tooltip);

      dot.addEventListener("click", () => {
        goToSlide(index);
      });

      navDotsContainer.appendChild(dot);
    });
  }

  // Preloader progress simulation
  function simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          preloader.style.opacity = "0";
          preloader.style.visibility = "hidden";
          // Initialize first slide animations
          activateSlide(0);
        }, 600);
      }
      loaderBarFill.style.width = `${progress}%`;
    }, 80);
  }

  // Number Counter Animation
  function animateCounters(slideElement) {
    const counters = slideElement.querySelectorAll(".counter");
    counters.forEach((counter) => {
      const targetStr = counter.getAttribute("data-target");
      const isDecimal = targetStr.includes(".");
      const target = parseFloat(targetStr);
      const duration = 1500; // 1.5 seconds
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        // Easing function: cubic ease-out
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = easeProgress * target;

        if (isDecimal) {
          // Format with correct number of decimals (usually 3 for beta)
          const decimals = targetStr.split(".")[1].length;
          counter.textContent = currentValue.toFixed(decimals);
        } else {
          counter.textContent = Math.floor(currentValue).toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = isDecimal ? targetStr : target.toLocaleString();
        }
      };

      requestAnimationFrame(updateCounter);
    });
  }

  // Dashboard Progress Bar Drawing
  function animateProgressBars(slideElement) {
    const fills = slideElement.querySelectorAll(".progress-fill");
    fills.forEach((fill) => {
      const targetWidth = fill.getAttribute("data-width") || "0%";
      // Force restyle reset
      fill.style.width = "0%";
      // Trigger reflow to let transition work
      fill.offsetHeight;
      fill.style.width = targetWidth;
    });
  }

  // Chart Bar Drawing
  function animateChartBars(slideElement) {
    const bars = slideElement.querySelectorAll(".chart-bar-fill");
    bars.forEach((bar) => {
      const targetHeight = bar.getAttribute("data-height") || "0%";
      bar.style.height = "0%";
      bar.offsetHeight; // reflow
      bar.style.height = targetHeight;
    });
  }

  // Activate Slide Animations & State
  function activateSlide(index) {
    slides.forEach((slide, i) => {
      const videos = slide.querySelectorAll("video");
      if (i === index) {
        slide.classList.add("active");
        // Trigger specific slide sub-animations
        animateCounters(slide);
        animateProgressBars(slide);
        animateChartBars(slide);
        
        // Auto-play videos when slide becomes active
        videos.forEach((video) => {
          video.currentTime = 0;
          video.play().catch((err) => {
            console.log("Auto-play prevented by browser policy:", err);
          });
        });
      } else {
        slide.classList.remove("active");
        // Auto-pause videos when leaving slide
        videos.forEach((video) => {
          video.pause();
        });
      }
    });

    // Update UI components
    const dots = document.querySelectorAll(".nav-dot");
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });

    if (currentSlideNum) {
      currentSlideNum.textContent = String(index + 1).padStart(2, "0");
    }

    if (progressBar) {
      const percentage = (index / (totalSlides - 1)) * 100;
      progressBar.style.width = `${percentage}%`;
    }

    // Toggle controls disabled state
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === totalSlides - 1;

    activeIndex = index;
  }

  // Transition to specific slide
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides || isTransitioning) return;

    if (isMobileLayout()) {
      // For mobile: scroll naturally to the target section
      slides[index].scrollIntoView({ behavior: "smooth" });
      activeIndex = index;
      activateSlide(index);
    } else {
      // For desktop: slide translation
      isTransitioning = true;
      wrapper.style.transform = `translateY(-${index * 100}vh)`;
      activateSlide(index);

      setTimeout(() => {
        isTransitioning = false;
      }, 850); // Matches transition duration in CSS
    }
  }

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    if (isMobileLayout()) return; // Let default key behavior happen on mobile

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex < totalSlides - 1) {
          goToSlide(activeIndex + 1);
        }
        break;
      case "ArrowUp":
      case "ArrowLeft":
      case "Backspace":
        e.preventDefault();
        if (activeIndex > 0) {
          goToSlide(activeIndex - 1);
        }
        break;
      case "PageDown":
        e.preventDefault();
        if (activeIndex < totalSlides - 1) {
          goToSlide(activeIndex + 1);
        }
        break;
      case "PageUp":
        e.preventDefault();
        if (activeIndex > 0) {
          goToSlide(activeIndex - 1);
        }
        break;
      case "Home":
        e.preventDefault();
        goToSlide(0);
        break;
      case "End":
        e.preventDefault();
        goToSlide(totalSlides - 1);
        break;
    }
  });

  // Mouse wheel navigation
  window.addEventListener(
    "wheel",
    (e) => {
      if (isMobileLayout() || isTransitioning) return;

      if (e.deltaY > 30) {
        // Scroll Down
        if (activeIndex < totalSlides - 1) {
          goToSlide(activeIndex + 1);
        }
      } else if (e.deltaY < -30) {
        // Scroll Up
        if (activeIndex > 0) {
          goToSlide(activeIndex - 1);
        }
      }
    },
    { passive: true },
  );

  // Touch Swipe Navigation (for tablet gestures on projector mode)
  window.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true },
  );

  window.addEventListener(
    "touchend",
    (e) => {
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    },
    { passive: true },
  );

  function handleSwipe() {
    if (isMobileLayout() || isTransitioning) return;

    const swipeDistance = touchEndY - touchStartY;
    const swipeThreshold = 50;

    if (swipeDistance < -swipeThreshold) {
      // Swipe Up -> Next Slide
      if (activeIndex < totalSlides - 1) {
        goToSlide(activeIndex + 1);
      }
    } else if (swipeDistance > swipeThreshold) {
      // Swipe Down -> Prev Slide
      if (activeIndex > 0) {
        goToSlide(activeIndex - 1);
      }
    }
  }

  // Footer button event listeners
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (activeIndex > 0) goToSlide(activeIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (activeIndex < totalSlides - 1) goToSlide(activeIndex + 1);
    });
  }

  // Mobile Intersection Observer Setup
  // When scrolling in mobile layout, observe slides crossing the screen to trigger animations and update dots/counter
  const mobileObserverOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.5, // trigger when slide is 50% visible
  };

  const mobileObserver = new IntersectionObserver((entries) => {
    if (!isMobileLayout()) return; // Only process on mobile layouts

    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = Array.from(slides).indexOf(entry.target);
        if (index !== -1 && index !== activeIndex) {
          activateSlide(index);
        }
      }
    });
  }, mobileObserverOptions);

  slides.forEach((slide) => {
    mobileObserver.observe(slide);
  });

  // Handle Resize Events (re-align slides if layout mode switches)
  let resizeId;
  window.addEventListener("resize", () => {
    clearTimeout(resizeId);
    resizeId = setTimeout(() => {
      if (!isMobileLayout()) {
        // Reset wrapper translations
        wrapper.style.transform = `translateY(-${activeIndex * 100}vh)`;
      } else {
        // Clear wrapper style in mobile layout to allow normal flow
        wrapper.style.transform = "";
      }
    }, 100);
  });

  // Start Presentation loading
  createNavDots();
  simulateLoading();
});
