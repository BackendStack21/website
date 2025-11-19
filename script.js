document.addEventListener("DOMContentLoaded", () => {
  // Copy functionality
  const copyButtons = document.querySelectorAll(".copy-btn");

  copyButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const codeBlock = btn.closest(".code-preview").querySelector("code");
      const code = codeBlock.textContent;

      try {
        await navigator.clipboard.writeText(code);

        // Visual feedback
        const originalText = btn.textContent;
        btn.textContent = "Copied!";
        btn.style.color = "#38bdf8"; // Primary color

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.color = "";
        }, 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
        btn.textContent = "Error";
      }
    });
  });

  // Scroll Animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Animate Feature Cards
  const features = document.querySelectorAll(".feature-card");
  features.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
    observer.observe(card);
  });

  // Animate Project Cards
  const projects = document.querySelectorAll(".project-card");
  projects.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    const delay = (index % 5) * 0.1;
    card.style.transition = `all 0.6s ease-out ${delay}s`;
    observer.observe(card);
  });

  // Smooth Scroll for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Blog Carousel
  let currentSlide = 0;
  let blogPosts = [];
  const carousel = document.getElementById("carouselItems"); // track
  const carouselSkeleton = document.getElementById("carouselSkeleton");
  const dotsContainer = document.getElementById("carouselDots");
  const carouselContainer = document.querySelector(".carousel-container");

  async function fetchMediumPosts() {
    // Check if elements exist
    if (!carousel) {
      console.error("Carousel element not found!");
      return;
    }

    try {
      // Using RSS2JSON API to fetch Medium RSS feed
      const rssUrl = encodeURIComponent("https://medium.com/feed/@kyberneees");
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
      console.log("Fetching from:", apiUrl); // Debug log

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("RSS2JSON Response:", data); // Debug log

      if (data.status === "ok" && data.items && data.items.length > 0) {
        // Filter posts related to 21no.de projects
        const keywords = [
          "21no.de",
          "21no",
          "restana",
          "fast-gateway",
          "0http",
          "bungate",
          "keycloak-backend",
          "node.js",
          "nodejs",
          "bun",
          "javascript",
          "typescript",
          "realtime",
          "backend",
          "api",
          "http",
          "https",
          "websocket",
          "realtime",
          "pub/sub",
          "performance",
          "rest api",
          "jwt",
          "swagger",
        ];

        const filteredPosts = data.items.filter((post) => {
          // Exclude small/response titles
          if (!post.title || post.title.includes("·") || post.title.length < 10) return false;
          const content = [
            post.title,
            post.description || "",
            post.content || "",
            (post.categories || []).join(" "),
            post.link || "",
          ]
            .join(" ")
            .toLowerCase();

          // Match either via keywords or if categories contain something meaningful
          const matched = keywords.some((keyword) => content.includes(keyword.toLowerCase()));
          // Also allow posts that are explicitly tagged (categories) with our keywords
          if (matched) return true;
          // Fallback: match if the link slug or title contains a project name
          return ["restana", "fast-gateway", "0http", "bungate"].some((k) => content.includes(k));
        });

        console.log(`Filtered ${filteredPosts.length} posts out of ${data.items.length}`); // Debug log
        console.log(
          "Filtered posts:",
          filteredPosts.map((p) => p.title)
        ); // Show titles
        // Detailed filter diagnostics
        data.items.forEach((p) => {
          const content = [p.title, p.description || "", p.content || "", (p.categories || []).join(" "), p.link || ""]
            .join(" ")
            .toLowerCase();
          const matched =
            keywords.some((k) => content.includes(k.toLowerCase())) ||
            ["restana", "fast-gateway", "0http", "bungate"].some((k) => content.includes(k));
          console.log(`Post: ${p.title} - matched: ${matched}`);
        });

        blogPosts =
          filteredPosts.length > 0
            ? filteredPosts.slice(0, 10)
            : data.items.filter((p) => p.title && p.title.length > 10).slice(0, 10);

        renderBlogPosts();
        initializeCarousel();
      } else {
        throw new Error(data.message || "Failed to fetch posts");
      }
    } catch (error) {
      console.error("Failed to load blog posts:", error);
      // Show error state or fallback
      if (carousel) {
        carousel.innerHTML = `
          <div class="blog-card" style="min-width: 100%; text-align: center;">
            <p style="color: var(--text-muted);">Unable to load blog posts. Visit our <a href="https://medium.com/@kyberneees/list/https21node-d2b18536a33d" target="_blank" style="color: var(--primary);">Medium blog</a> directly.</p>
          </div>
        `;
        if (carouselSkeleton) carouselSkeleton.style.display = "none";
        carousel.style.display = "flex";
      }
    }
  }

  function renderBlogPosts() {
    carousel.innerHTML = blogPosts
      .map(
        (post) => `
        <div class="blog-card" onclick="window.open('${post.link}', '_blank')">
          ${post.thumbnail ? `<div class="post-image"><img src="${post.thumbnail}" alt="${post.title}"/></div>` : ""}
          <h3>${post.title}</h3>
          <div class="blog-excerpt">${stripHtml(post.description)}</div>
          <div class="blog-meta">
            <span class="blog-date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              ${formatDate(post.pubDate)}
            </span>
          </div>
        </div>
      `
      )
      .join("");

    // Hide skeleton, show carousel
    if (carouselSkeleton) carouselSkeleton.style.display = "none";
    carousel.style.display = "flex";
  }

  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function initializeCarousel() {
    if (!carousel || !dotsContainer || !carouselContainer) return;

    const cards = carousel.querySelectorAll(".blog-card");
    if (cards.length === 0) return;

    const prevBtn = document.querySelector(".carousel-prev");
    const nextBtn = document.querySelector(".carousel-next");

    if (!prevBtn || !nextBtn) return;

    // Determine card width & cards per view based on container width
    const gap = 24; // matches CSS gap
    const cardWidth = cards[0].offsetWidth || 320;
    const containerWidth = carouselContainer.offsetWidth || window.innerWidth;
    let cardsPerView = Math.max(1, Math.floor(containerWidth / (cardWidth + gap)));
    const totalSlides = Math.ceil(cards.length / cardsPerView);

    // Create dots (initial)
    dotsContainer.innerHTML = "";
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement("button");
      dot.className = `carousel-dot ${i === 0 ? "active" : ""}`;
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }

    function updateCarousel() {
      // Recalculate responsive cards per view
      cardsPerView = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
      const dynamicCardWidth = cards[0] && cards[0].offsetWidth ? cards[0].offsetWidth : cardWidth;
      const dynamicGap = gap;
      const totalSlidesDynamic = Math.ceil(cards.length / cardsPerView);
      const offsetPx = currentSlide * cardsPerView * (dynamicCardWidth + dynamicGap);
      carousel.style.transform = `translateX(-${offsetPx}px)`;

      // Update dots
      document.querySelectorAll(".carousel-dot").forEach((dot, index) => {
        dot.classList.toggle("active", index === currentSlide);
      });

      // Update button states
      prevBtn.disabled = currentSlide === 0;
      nextBtn.disabled = currentSlide >= totalSlidesDynamic - 1;
      prevBtn.style.opacity = currentSlide === 0 ? "0.3" : "1";
      nextBtn.style.opacity = currentSlide >= totalSlidesDynamic - 1 ? "0.3" : "1";
      // Recreate dots if needed (cardsPerView changed totalSlides)
      if (dotsContainer.children.length !== totalSlidesDynamic) {
        dotsContainer.innerHTML = "";
        for (let i = 0; i < totalSlidesDynamic; i++) {
          const dot = document.createElement("button");
          dot.className = `carousel-dot ${i === currentSlide ? "active" : ""}`;
          dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
          dot.addEventListener("click", () => goToSlide(i));
          dotsContainer.appendChild(dot);
        }
      }
    }

    function goToSlide(index) {
      const totalSlidesDynamic = Math.ceil(cards.length / cardsPerView);
      currentSlide = Math.max(0, Math.min(index, totalSlidesDynamic - 1));
      updateCarousel();
    }

    prevBtn.addEventListener("click", () => {
      if (currentSlide > 0) {
        currentSlide--;
        updateCarousel();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateCarousel();
      }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        currentSlide = 0;
        initializeCarousel();
      }, 250);
    });

    updateCarousel();
    console.log(`Carousel initialized. cards=${cards.length}`, { cardsPerView, totalSlides });
  }

  // Load blog posts
  fetchMediumPosts();
});
