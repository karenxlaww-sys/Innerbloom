/* jshint esversion: 6 */
/* global gsap */
/* exported scrollToSection, changeCompassionCard, changeAffirmation, downloadAffirmation, flipCard */

/**
 * InnerBloom - Interactive Mindfulness Website
 * Main JavaScript file containing all interactive functionality
 */

/**
 * Initialize scrolling character strips in hero section
 * Creates duplicate sets of character images to enable infinite scroll effect
 */
function initScrollStrips() {
    // Get container elements for top and bottom scrolling strips
    const topStrip = document.getElementById('topStrip');
    const bottomStrip = document.getElementById('bottomStrip');
    
    // Array of character images for scrolling strips
    const characterImages = [
        'images/pill.png',          // Pill character
        'images/flower.png',        // Flower character
        'images/heart.png',         // Heart character
        'images/square.png',        // Square character
        'images/pill.png',          // Pill character (repeated)
        'images/circle.png',        // Circle character
        'images/triangle.png',      // Triangle character
        'images/thumb.png',         // Thumb character
        'images/breathingflower.png' // Breathing flower character
    ];
    
    // Create enough character repeats to fill width plus overflow for seamless scroll
    const repeats = 30;
    
    // Loop through repeats and create image elements
    for (let i = 0; i < repeats; i++) {
        characterImages.forEach(imgUrl => {
            // Create image element for top strip
            const img1 = document.createElement('img');
            img1.src = imgUrl;
            img1.className = 'emotion';
            img1.style.width = '80px';
            img1.style.height = '80px';
            img1.style.objectFit = 'contain';
            
            // Clone image for bottom strip
            const img2 = img1.cloneNode(true);
            
            // Append to respective strips
            topStrip.appendChild(img1);
            bottomStrip.appendChild(img2);
        });
    }
  }
  
  /**
   * Play click sound when navigation arrows are pressed
   * Uses Web Audio API to generate a simple sine wave tone
   */
  function playClickSound() {
    // Create audio context
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioCtx();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect audio nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set frequency to A4 (440 Hz)
    oscillator.frequency.value = 440;
    oscillator.type = 'sine';
    
    // Set volume and create fade out effect
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    // Play sound for 0.3 seconds
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }
  
  /**
   * Smooth scroll to target section with sound effect
   * @param {string} sectionId - ID of the section to scroll to
   */
  function scrollToSection(sectionId) {
    playClickSound(); // Play click sound
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' }); // Smooth scroll to section
    }
  }
  
  // ========================================
  // BREATHING SECTION MUSIC CONTROL
  // ========================================
  
  // Get DOM elements
  const breathingMusic = document.getElementById('breathingMusic');
  const breathingSection = document.getElementById('breathing');
  
  // State variables for music control
  let musicFading = false;          // Track if music is currently fading
  let breathingPaused = false;      // Track if breathing exercise is paused
  let soundMuted = false;           // Track if sound is muted
  let isInBreathingSection = false; // Track if user is viewing breathing section
  let fadeInterval = null;          // Store interval ID for fade effect
  
  // Initialize audio volume to 0
  breathingMusic.volume = 0;
  
  /**
   * Intersection Observer to detect when user enters/leaves breathing section
   * Automatically fades music in when entering, fades out when leaving
   */
  const musicObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // User entered breathing section
            console.log('Entering breathing section');
            isInBreathingSection = true;
            
            // Only play music if not muted and not paused
            if (!soundMuted && !breathingPaused) {
                breathingMusic.volume = 0; // Start from volume 0
                breathingMusic.play().catch(err => console.log('Play failed:', err));
                fadeVolume(0, 0.5, 2000); // Fade in to volume 0.5 over 2 seconds
            }
        } else {
            // User left breathing section
            console.log('Leaving breathing section');
            isInBreathingSection = false;
            
            // Fade out and stop music
            fadeVolume(breathingMusic.volume, 0, 2000, () => {
                breathingMusic.pause();
                breathingMusic.currentTime = 0; // Reset to beginning
                breathingMusic.volume = 0;
            });
        }
    });
  }, { threshold: 0.3 }); // Trigger when 30% of section is visible
  
  /**
   * Fade audio volume over specified duration
   * @param {number} startVol - Starting volume (0-1)
   * @param {number} endVol - Target volume (0-1)
   * @param {number} duration - Duration in milliseconds
   * @param {function} callback - Function to call when fade completes
   */
  function fadeVolume(startVol, endVol, duration, callback) {
    // Clear any existing fade interval to prevent conflicts
    if (fadeInterval) {
        clearInterval(fadeInterval);
        fadeInterval = null;
    }
    
    musicFading = true;
    const steps = 50;                              // Number of volume adjustment steps
    const stepTime = duration / steps;             // Time between each step
    const volumeStep = (endVol - startVol) / steps; // Volume change per step
    let currentStep = 0;
  
    // Create interval to gradually adjust volume
    fadeInterval = setInterval(() => {
        currentStep++;
        // Calculate and set new volume, ensuring it stays within 0-1 range
        breathingMusic.volume = Math.max(0, Math.min(1, startVol + (volumeStep * currentStep)));
        
        // Check if fade is complete
        if (currentStep >= steps) {
            clearInterval(fadeInterval);
            fadeInterval = null;
            musicFading = false;
            if (callback) callback(); // Execute callback if provided
        }
    }, stepTime);
  }
  
  // Start observing the breathing section
  musicObserver.observe(breathingSection);
  
  // Get control button elements
  const pauseBtn = document.getElementById('pauseBtn');
  const soundBtn = document.getElementById('soundBtn');
  const breathingFlower = document.querySelector('.breathing-flower img');
  
  /**
   * Pause/Resume button click handler
   * Controls both the breathing animation and music playback
   */
  pauseBtn.addEventListener('click', () => {
    if (breathingPaused) {
        // Resume breathing exercise
        breathingFlower.style.animationPlayState = 'running';
        
        // Resume music if not muted and in breathing section
        if (!soundMuted && isInBreathingSection) {
            breathingMusic.play().catch(err => console.log('Play failed:', err));
        }
        
        // Change icon to pause
        pauseBtn.name = 'pause-circle';
        breathingPaused = false;
    } else {
        // Pause breathing exercise
        breathingFlower.style.animationPlayState = 'paused';
        breathingMusic.pause();
        
        // Change icon to play
        pauseBtn.name = 'play-circle';
        breathingPaused = true;
    }
  });
  
  /**
   * Sound mute/unmute button click handler
   * Controls music audio without affecting animation
   */
  soundBtn.addEventListener('click', () => {
    soundMuted = !soundMuted; // Toggle mute state
    
    if (soundMuted) {
        // Mute: pause music and change icon
        breathingMusic.pause();
        soundBtn.name = 'volume-mute';
    } else {
        // Unmute: resume music if conditions are met and change icon
        if (!breathingPaused && isInBreathingSection) {
            breathingMusic.play().catch(err => console.log('Play failed:', err));
        }
        soundBtn.name = 'volume-up';
    }
  });
  
  // ========================================
  // SELF COMPASSION GALLERY
  // ========================================
  
  /**
   * Array of compassion messages with associated styling
   * Each object contains text, background color, text color, and character image
   */
  const compassionMessages = [
      { 
          text: '"It\'s human to repeat mistakes."', 
          bg: '#F4D06F',              // Yellow background
          color: '#3A7D5A',           // Green text
          charImg: 'images/heart.png'
      },
      { 
          text: '"I deserve kindness, especially from myself."', 
          bg: '#F0A8B8',              // Pink background
          color: '#2C2C2C',           // Dark text
          charImg: 'images/flower.png'
      },
      { 
          text: '"Progress isn\'t always visible, but it\'s happening."', 
          bg: '#A8C7E7',              // Blue background
          color: '#2C2C2C',           // Dark text
          charImg: 'images/thumb.png'
      },
      { 
          text: '"My feelings are valid, no matter what they are."', 
          bg: '#F4A261',              // Orange background
          color: '#F5F2ED',           // Light text
          charImg: 'images/pill.png'
      },
      { 
          text: '"It\'s okay to rest when I need to."', 
          bg: '#3A7D5A',              // Green background
          color: '#F0A8B8',           // Pink text
          charImg: 'images/flower.png'
      },
      { 
          text: '"I am doing better than I think."', 
          bg: '#F4D06F',              // Yellow background
          color: '#2C2C2C',           // Dark text
          charImg: 'images/heart.png'
      },
      { 
          text: '"Small steps forward are still progress."', 
          bg: '#F0A8B8',              // Pink background
          color: '#3A7D5A',           // Green text
          charImg: 'images/triangle.png'
      },
      { 
          text: '"I don\'t have to be perfect to be worthy."', 
          bg: '#A8C7E7',              // Blue background
          color: '#2C2C2C',           // Dark text
          charImg: 'images/breathingflower.png'
      }
  ];
  
  // Track current message index
  let currentCompassionIndex = 0;
  
  /**
   * Change compassion card with slide animation
   * @param {number} direction - Direction to slide (1 for next, -1 for previous)
   */
  function changeCompassionCard(direction) {
    // Get DOM elements
    const compassionText = document.getElementById('compassionText');
    const compassionCard = document.getElementById('compassionCard');
    const compassionChar = document.getElementById('compassionChar');
    
    // Slide out animation - move in direction of button press
    compassionCard.style.transform = direction === 1 ? 'translateX(-100px)' : 'translateX(100px)';
    compassionCard.style.opacity = '0';
    compassionChar.style.transform = 'scale(0.8)';
    compassionChar.style.opacity = '0';
    
    // Wait for slide out animation to complete
    setTimeout(() => {
        // Calculate new index with wraparound
        currentCompassionIndex = (currentCompassionIndex + direction + compassionMessages.length) % compassionMessages.length;
        const currentMessage = compassionMessages[currentCompassionIndex];
        
        // Update card content and styling
        compassionText.textContent = currentMessage.text;
        compassionCard.style.backgroundColor = currentMessage.bg;
        compassionText.style.color = currentMessage.color;
        compassionChar.src = currentMessage.charImg;
        
        // Position card off-screen on opposite side for slide in
        compassionCard.style.transform = direction === 1 ? 'translateX(100px)' : 'translateX(-100px)';
        
        // Trigger reflow to ensure transform is applied
        // compassionCard.offsetHeight; // Force reflow for animation
        
        // Slide in animation - move to center
        compassionCard.style.transform = 'translateX(0)';
        compassionCard.style.opacity = '1';
        compassionChar.style.transform = 'scale(1)';
        compassionChar.style.opacity = '1';
    }, 300); // Match CSS transition duration
  }
  
  // ========================================
// AFFIRMATIONS SECTION
// ========================================

/**
 * Array of affirmation messages with associated styling
 * Each affirmation includes text, background color, text color, and character image
 */
const affirmations = [
    { 
        text: '"I am calm, I am safe, I am present."', 
        bg: '#3A7D5A',              // Green background
        color: '#F0A8B8',           // Pink text
        charImg: 'images/heart.png' // Heart character
    },
    { 
        text: '"I am worthy of love and compassion."', 
        bg: '#A8C7E7',              // Blue background
        color: '#2C2C2C',           // Dark text
        charImg: 'images/pill.png'  // Pill character
    },
    { 
        text: '"I embrace peace in this moment."', 
        bg: '#F4A261',              // Orange background
        color: '#F5F2ED',           // Light text
        charImg: 'images/triangle.png' // Triangle character
    },
    { 
        text: '"I trust in my journey and my growth."', 
        bg: '#F0A8B8',              // Pink background
        color: '#3A7D5A',           // Green text
        charImg: 'images/thumb.png' // Thumb character
    },
    { 
        text: '"I release what I cannot control."', 
        bg: '#F4D06F',              // Yellow background
        color: '#2C2C2C',           // Dark text
        charImg: 'images/breathingflower.png' // Breathing flower
    },
    { 
        text: '"I am enough, just as I am."', 
        bg: '#3A7D5A',              // Green background
        color: '#A8C7E7',           // Blue text
        charImg: 'images/flower.png' // Flower character
    },
    { 
        text: '"I choose kindness towards myself."', 
        bg: '#A8C7E7',              // Blue background
        color: '#2C2C2C',           // Dark text
        charImg: 'images/heart.png' // Heart character
    },
    { 
        text: '"I breathe in calm, I breathe out worry."', 
        bg: '#F4A261',              // Orange background
        color: '#F5F2ED',           // Light text
        charImg: 'images/breathingflower.png' // Breathing flower
    },
    { 
        text: '"I am grounded in the present moment."', 
        bg: '#F0A8B8',              // Pink background
        color: '#F4D06F',           // Yellow text
        charImg: 'images/flower.png' // Flower character
    },
    { 
        text: '"I deserve rest and gentle care."', 
        bg: '#F4D06F',              // Yellow background
        color: '#3A7D5A',           // Green text
        charImg: 'images/triangle.png' // Triangle character
    }
  ];
  
  // Track current affirmation index
  let currentAffirmationIndex = 0;
  
  /**
   * Change to next affirmation with fade animation
   * Cycles through affirmations array and updates card styling
   */
  function changeAffirmation() {
    // Calculate next index with wraparound
    currentAffirmationIndex = (currentAffirmationIndex + 1) % affirmations.length;
    
    // Get DOM elements
    const affirmationText = document.getElementById('affirmationText');
    const affirmationDisplay = document.getElementById('affirmationDisplay');
    const affirmationChar = document.getElementById('affirmationChar');
    const currentAffirmation = affirmations[currentAffirmationIndex];
    
    // Fade out current affirmation
    affirmationText.style.opacity = '0';
    affirmationText.style.transform = 'scale(0.95)';
    
    // Wait for fade out, then update content and fade in
    setTimeout(() => {
        // Update text content
        affirmationText.textContent = currentAffirmation.text;
        
        // Update background color
        affirmationDisplay.style.backgroundColor = currentAffirmation.bg;
        
        // Update text color
        affirmationText.style.color = currentAffirmation.color;
        
        // Update character image
        affirmationChar.src = currentAffirmation.charImg;
        
        // Fade in new affirmation
        affirmationText.style.opacity = '1';
        affirmationText.style.transform = 'scale(1)';
    }, 300); // Match CSS transition duration
  }
  
 /**
 * Show download confirmation using Shoelace Alert
 * Displays toast notification when affirmation is "downloaded"
 * Manual control approach for consistent behavior
 */
function downloadAffirmation() {
    // Get Shoelace alert element
    const alert = document.getElementById('downloadAlert');
    
    // Manually show the alert
    alert.open = true;
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
        alert.open = false;
    }, 2000);
}
  
  // ========================================
  // PAGE INITIALIZATION
  // ========================================
  
  /**
   * Initialize all interactive elements when DOM is fully loaded
   * Sets up GSAP animations, affirmation transitions, and scrolling strips
   */
  document.addEventListener('DOMContentLoaded', () => {
    // Get affirmation text element
    const affirmationText = document.getElementById('affirmationText');
    
    // Set up smooth transitions for affirmation changes
    affirmationText.style.transition = 'opacity 0.3s ease, transform 0.3s ease, color 0.5s ease';
    
    // Initialize scrolling character strips in hero section
    initScrollStrips();
    
    // GSAP Animation: Animate hero section heading on page load
    // Slides down and fades in from above
    gsap.from('#hero h1', {
        duration: 1.2,           // Animation duration in seconds
        y: -50,                  // Start position 50px above
        opacity: 0,              // Start fully transparent
        ease: 'power3.out'       // Easing function for smooth deceleration
    });
    
    // GSAP Animation: Animate hero section subtitle
    // Slides up and fades in from below with slight delay
    gsap.from('#hero p', {
        duration: 1.2,           // Animation duration in seconds
        y: 50,                   // Start position 50px below
        opacity: 0,              // Start fully transparent
        delay: 0.3,              // Delay start by 0.3 seconds
        ease: 'power3.out'       // Easing function for smooth deceleration
    });
    
    // GSAP ScrollTrigger: Animate practice cards as they scroll into view
    // Each card animates with a staggered delay
    gsap.utils.toArray('.practice-card').forEach((card, index) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,              // Element that triggers the animation
                start: 'top 80%',           // Start when top of card is 80% down viewport
                toggleActions: 'play none none reverse' // Play on enter, reverse on leave
            },
            duration: 0.8,                  // Animation duration in seconds
            y: 50,                          // Start position 50px below
            opacity: 0,                     // Start fully transparent
            delay: index * 0.1,             // Stagger delay based on card index
            ease: 'power2.out'              // Easing function
        });
    });
  });
  
  // ========================================
  // PRACTICE CARD FLIP FUNCTIONALITY
  // ========================================
  
  /**
   * Toggle flip state of practice card when clicked
   * Shows practice information on back of card
   * @param {Event} event - Click event object
   */
  function flipCard(event) {
    // Prevent event from bubbling up to parent elements
    event.stopPropagation();
    event.preventDefault();
    
    // Find the practice-card parent element by traversing up DOM tree
    let card = event.target;
    while (card && !card.classList.contains('practice-card')) {
        card = card.parentElement;
    }
    
    // If practice-card found, toggle the 'flipped' class
    if (card) {
        card.classList.toggle('flipped');
    }
  }
  
  // ========================================
  // INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS
  // ========================================
  
  /**
   * Configuration options for Intersection Observer
   * Controls when elements are considered "in view"
   */
  const observerOptions = {
    threshold: 0.1,                    // Trigger when 10% of element is visible
    rootMargin: '0px 0px -100px 0px'   // Adjust viewport bounds (bottom margin)
  };
  
  /**
   * Intersection Observer to fade in sections as they scroll into view
   * Provides smooth entrance animations for all main sections
   */
  const observer = new IntersectionObserver((entries) => {
    // Loop through all observed elements
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Element is in view - fade in and slide up
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
  }, observerOptions);
  
  // Set initial state and observe all sections except hero
  // Hero section doesn't need fade-in since it's visible on page load
  document.querySelectorAll('section:not(#hero)').forEach(section => {
    // Set initial state: invisible and slightly below final position
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    
    // Set transition properties for smooth animation
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    
    // Start observing this section
    observer.observe(section);
  });
