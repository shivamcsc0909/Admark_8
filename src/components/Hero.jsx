import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Hero Component
function Hero() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isInHero, setIsInHero] = useState(false);
  const [activeImages, setActiveImages] = useState([]);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [cursorSpeed, setCursorSpeed] = useState(0);
  const [movementDirection, setMovementDirection] = useState({ x: 0, y: 0 });
  
  const videoRef = useRef(null);
  const heroRef = useRef(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(Date.now());
  const imageIdRef = useRef(0);
  const animationFrameRef = useRef(null);
  const movementHistoryRef = useRef([]);
  const HISTORY_SIZE = 3;

  // Sample images array - replace with your actual image paths
  const cursorImages = [
    '/src/assets/images/img1.jpg',
    '/src/assets/images/img2.jpg',
    '/src/assets/images/img3.jpg',
    '/src/assets/images/img4.jpg',
    '/src/assets/images/img5.jpg',
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTimeRef.current;
      
      // IMMEDIATE UPDATE - NO DELAY
      setCursorPosition({ x: e.clientX, y: e.clientY });
      
      if (timeDiff > 16) { // 60 FPS throttle - smooth performance
        const currentX = e.clientX;
        const currentY = e.clientY;
        const deltaX = currentX - lastPositionRef.current.x;
        const deltaY = currentY - lastPositionRef.current.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const speed = distance / timeDiff;
        
        setCursorSpeed(speed);
        
        if (distance > 0) {
          const dirX = deltaX / distance;
          const dirY = deltaY / distance;
          setMovementDirection({ x: dirX, y: dirY });
          
          // Store movement - SMALLER HISTORY
          movementHistoryRef.current.push({
            x: currentX,
            y: currentY,
            timestamp: currentTime
          });
          
          // Keep only 3 recent points - NOT 10!
          if (movementHistoryRef.current.length > 3) {
            movementHistoryRef.current.shift();
          }
        }
        
        // TRIGGER IMMEDIATELY - NO COMPLEX CONDITIONS
        if (speed > 0.03 && isInHero) { // Very low threshold
          triggerImageSequence(currentX, currentY, speed);
        }
        
        lastPositionRef.current = { x: currentX, y: currentY };
        lastTimeRef.current = currentTime;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInHero]);

  useEffect(() => {
    // Handle video loading and play
    const video = videoRef.current;
    if (video) {
      const handleCanPlay = () => {
        setVideoLoaded(true);
        video.play().catch(err => {
          console.log('Video play failed:', err);
        });
      };

      video.addEventListener('canplay', handleCanPlay);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, []);

  const triggerImageSequence = (currentX, currentY, speed) => {
    // NO MINIMUM HISTORY CHECK - INSTANT TRIGGER
    const baseSize = 400;
    const imageWidth = baseSize * 0.8;
    const imageHeight = imageWidth * 0.625;

    const newImageId = imageIdRef.current++;
    const imageIndex = (newImageId % cursorImages.length);

    // CREATE IMMEDIATELY - NO LOOP, NO DELAY
    const newImage = {
      id: newImageId,
      x: currentX,
      y: currentY,
      src: cursorImages[imageIndex],
      createdAt: Date.now(),
      width: imageWidth,
      height: imageHeight,
      progress: 0,
      direction: movementDirection
    };

    setActiveImages(prev => {
      const updated = [...prev, newImage];
      // Keep max 4 images
      return updated.slice(-4);
    });

    // Auto remove after 1.5 seconds
    setTimeout(() => {
      setActiveImages(prev => prev.filter(img => img.id !== newImageId));
    }, 1500);
  };

  const handleMouseEnter = () => setIsInHero(true);
  const handleMouseLeave = () => {
    setIsInHero(false);
    // Clear all images when leaving hero section
    setActiveImages([]);
    movementHistoryRef.current = [];
  };

  const handleVideoError = () => {
    console.error('Video failed to load');
    setVideoLoaded(false);
  };

  // Faster animation
  const getImageAnimation = (image, index) => {
    return {
      initial: { 
        opacity: 0, 
        scale: 0.5,
        x: -movementDirection.x * 30,
        y: -movementDirection.y * 30
      },
      animate: { 
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        transition: {
          duration: 0.15, // VERY FAST - 0.15s
          ease: "easeOut"
        }
      },
      exit: { 
        opacity: 0, 
        scale: 0.7,
        transition: {
          duration: 0.15,
          ease: "easeIn"
        }
      }
    };
  };

  return (
    <section 
      ref={heroRef}
      id="home" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden cursor-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Full Screen Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={handleVideoError}
          className="w-full h-full object-cover"
        >
          <source src="/src/assets/home.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Video loading fallback */}
        {!videoLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Main Content - Centered */}
      <div className="relative z-10 text-center text-white px-4 w-full max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-tight"
          style={{
            color: 'white',
            fontFamily: "montserrat",
            width: '100%',
            textShadow: '3px 3px 12px rgba(0,0,0,0.8)',
            fontWeight: 'bold',
            letterSpacing: '2px',
          }}
        >
          Admark Digital Media
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-2xl md:text-3xl lg:text-4xl font-light mb-8 leading-relaxed text-white"
          style={{
            fontFamily: "montserrat",
            textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
          }}
        >
          Elevate your brand with expert digital marketing
        </motion.p>
      </div>

      {/* Sequential Popup Images */}
      <AnimatePresence>
        {activeImages.map((image, index) => {
          const animation = getImageAnimation(image, index);
          
          return (
            <motion.div
              key={image.id}
              className="fixed pointer-events-none z-50"
              style={{
                left: image.x,
                top: image.y,
                transform: 'translate(-50%, -50%)',
                zIndex: 50 + index,
              }}
              initial={animation.initial}
              animate={animation.animate}
              exit={animation.exit}
            >
              <motion.img
                src={image.src}
                alt="Popup image"
                className="popup-image"
                style={{
                  width: `${image.width}px`,
                  height: `${image.height}px`,
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.9)',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = `https://picsum.photos/${Math.floor(image.width)}/${Math.floor(image.height)}?random=${image.id}`;
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* CURSOR REMOVED - Only image animation remains */}

      <style jsx>{`
        .popup-image {
          object-fit: cover;
          transition: all 0.2s ease;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
      `}</style>

      <style jsx global>{`
        /* Hide default cursor when in hero section */
        #home, #home * {
          cursor: none !important;
        }

        /* Import Google Font for cursive style */
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap');
      `}</style>
    </section>
  );
}

// Sidebar Component
function Sidebar() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    websiteUrl: '',
    websiteName: '',
    email: '',
    phone: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '/services' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Testimonial', href: '/testimonial' }
  ];

  const handleSmoothScroll = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    
    setTimeout(() => {
      setIsSubmitted(false);
      setIsPopupOpen(false);
      setFormData({
        websiteUrl: '',
        websiteName: '',
        email: '',
        phone: ''
      });
    }, 3000);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search query:', searchQuery);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const openPopup = () => {
    setIsPopupOpen(true);
    setIsSubmitted(false);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setIsSubmitted(false);
    setFormData({
      websiteUrl: '',
      websiteName: '',
      email: '',
      phone: ''
    });
  };

  const openSearch = () => {
    setIsSearchOpen(true);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const FreeAuditPopup = () => {
    if (!isPopupOpen) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          borderRadius: '12px',
          padding: '30px',
          width: '95%',
          maxWidth: '450px',
          border: '2px solid #FF8C00',
          boxShadow: '0 10px 40px rgba(255, 140, 0, 0.3)',
          position: 'relative'
        }}>
          <button
            onClick={closePopup}
            style={{
              position: 'absolute',
              top: '12px',
              right: '15px',
              background: '#333',
              border: '1px solid #FF8C00',
              color: '#FF8C00',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#FF8C00';
              e.target.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#333';
              e.target.style.color = '#FF8C00';
            }}
          >
            ×
          </button>

          {!isSubmitted ? (
            <>
              <h2 style={{
                color: '#FF8C00',
                textAlign: 'center',
                marginBottom: '25px',
                fontSize: '32px',
                fontWeight: '700',
                fontFamily: "'Montserrat', sans-serif",
                textShadow: '0 2px 10px rgba(255, 140, 0, 0.4)'
              }}>
                Free Website Audit
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{
                    display: 'block',
                    color: '#FF8C00',
                    marginBottom: '8px',
                    fontWeight: '600',
                    fontSize: '18px',
                    fontFamily: "'Montserrat', sans-serif"
                  }}>
                    Website URL *
                  </label>
                  <input
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '6px',
                      border: '1px solid #FF8C00',
                      background: '#0a0a0a',
                      color: '#fff',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      fontFamily: "'Montserrat', sans-serif"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FFA500';
                      e.target.style.boxShadow = '0 0 10px rgba(255, 140, 0, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#FF8C00';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{
                    display: 'block',
                    color: '#FF8C00',
                    marginBottom: '8px',
                    fontWeight: '600',
                    fontSize: '18px',
                    fontFamily: "'Montserrat', sans-serif"
                  }}>
                    Website Name *
                  </label>
                  <input
                    type="text"
                    name="websiteName"
                    value={formData.websiteName}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '6px',
                      border: '1px solid #FF8C00',
                      background: '#0a0a0a',
                      color: '#fff',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      fontFamily: "'Montserrat', sans-serif"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FFA500';
                      e.target.style.boxShadow = '0 0 10px rgba(255, 140, 0, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#FF8C00';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{
                    display: 'block',
                    color: '#FF8C00',
                    marginBottom: '8px',
                    fontWeight: '600',
                    fontSize: '18px',
                    fontFamily: "'Montserrat', sans-serif"
                  }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '6px',
                      border: '1px solid #FF8C00',
                      background: '#0a0a0a',
                      color: '#fff',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      fontFamily: "'Montserrat', sans-serif"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FFA500';
                      e.target.style.boxShadow = '0 0 10px rgba(255, 140, 0, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#FF8C00';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={{
                    display: 'block',
                    color: '#FF8C00',
                    marginBottom: '8px',
                    fontWeight: '600',
                    fontSize: '18px',
                    fontFamily: "'Montserrat', sans-serif"
                  }}>
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '6px',
                      border: '1px solid #FF8C00',
                      background: '#0a0a0a',
                      color: '#fff',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      fontFamily: "'Montserrat', sans-serif"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FFA500';
                      e.target.style.boxShadow = '0 0 10px rgba(255, 140, 0, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#FF8C00';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #FF8C00, #FFD700, #FF6347)',
                    color: '#000',
                    border: 'none',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: '18px',
                    transition: 'all 0.3s ease',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #FFA500, #FFDF00, #FF7F50)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 5px 15px rgba(255, 140, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #FF8C00, #FFD700, #FF6347)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Submit for Free Audit
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '50px', marginBottom: '15px' }}>✅</div>
              <h3 style={{ 
                color: '#FF8C00', 
                fontSize: '26px', 
                marginBottom: '12px', 
                fontWeight: '700',
                fontFamily: "'Montserrat', sans-serif",
                textShadow: '0 2px 10px rgba(255, 140, 0, 0.4)'
              }}>
                Request Submitted!
              </h3>
              <p style={{ 
                color: '#ccc', 
                fontSize: '18px',
                fontFamily: "'Montserrat', sans-serif",
                lineHeight: '1.5'
              }}>
                Your free audit report will be sent to your email within 24 hours.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SearchPopup = () => {
    if (!isSearchOpen) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          borderRadius: '12px',
          padding: '30px',
          width: '95%',
          maxWidth: '450px',
          border: '2px solid #FF8C00',
          boxShadow: '0 10px 40px rgba(255, 140, 0, 0.3)',
          position: 'relative'
        }}>
          <button
            onClick={closeSearch}
            style={{
              position: 'absolute',
              top: '12px',
              right: '15px',
              background: '#333',
              border: '1px solid #FF8C00',
              color: '#FF8C00',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#FF8C00';
              e.target.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#333';
              e.target.style.color = '#FF8C00';
            }}
          >
            ×
          </button>

          <h2 style={{
            color: '#FF8C00',
            textAlign: 'center',
            marginBottom: '25px',
            fontSize: '32px',
            fontWeight: '700',
            fontFamily: "'Montserrat', sans-serif",
            textShadow: '0 2px 10px rgba(255, 140, 0, 0.4)'
          }}>
            Search Our Site
          </h2>
          
          <form onSubmit={handleSearchSubmit}>
            <div style={{ marginBottom: '25px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What you're looking for..."
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid #FF8C00',
                  background: '#0a0a0a',
                  color: '#fff',
                  fontSize: '18px',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Montserrat', sans-serif"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FFA500';
                  e.target.style.boxShadow = '0 0 15px rgba(255, 140, 0, 0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#FF8C00';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #FF8C00, #FFD700, #FF6347)',
                color: '#000',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '18px',
                transition: 'all 0.3s ease',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #FFA500, #FFDF00, #FF7F50)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 5px 15px rgba(255, 140, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #FF8C00, #FFD700, #FF6347)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Search Now
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Add Google Fonts for Montserrat */}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        {/* Sidebar Toggle Button - MOVED TO LEFT MIDDLE */}
        <motion.button
          onClick={toggleSidebar}
          className="fixed z-[1000]"
          style={{
            left: isSidebarExpanded ? '250px' : '0px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#ffffffff',
            border: '2px solid #D4AF37',
            color: '#D4AF37',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)',
            zIndex: 1000
          }}
          animate={{
            left: isSidebarExpanded ? '250px' : '0px',
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onMouseEnter={(e) => {
            e.target.style.background = '#D4AF37';
            e.target.style.color = '#000';
            e.target.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#D4AF37';
            e.target.style.boxShadow = '0 0 10px rgba(212, 175, 55, 0.3)';
          }}
        >
          {isSidebarExpanded ? '<' : '>'}
        </motion.button>

        {/* Sidebar */}
        <motion.nav 
          className="fixed top-0 left-0 h-full z-[999] transition-all duration-500"
          style={{
            background: '#000000',
            backdropFilter: 'blur(15px)',
            borderRight: '2px solid #FF8C00',
            overflow: 'hidden',
            boxShadow: '5px 0 25px rgba(255, 140, 0, 0.15)'
          }}
          animate={{
            width: isSidebarExpanded ? '250px' : '0px',
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              padding: '20px 10px',
              justifyContent: 'space-between',
              width: '250px',
              opacity: isSidebarExpanded ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }}
          >
            {/* Logo Container - UPDATED WITH BORDER NONE AND BLACK COLOR */}
            <div style={{ 
              textAlign: 'center',
              marginBottom: '15px',
              padding: '10px 0'
            }}>
              <a href="#home">
                <div style={{
                  width: '200px',
                  height: '120px',
                  margin: '0 auto',
                  borderRadius: '8px',
                  background: '#000000', // Black background
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none', // Border removed
                  boxShadow: '0 0 20px rgba(255, 140, 0, 0.5)',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 0 25px rgba(255, 140, 0, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 0 20px rgba(255, 140, 0, 0.5)';
                }}
                >
                  <img 
                    src="/src/assets/comp-logo.png" 
                    alt="ADMARK Logo" 
                    style={{
                      width: '100%', // Full width according to space
                      height: '100%', // Full height according to space
                      objectFit: 'contain', // Fit the image properly
                      padding: '5px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{
                    display: 'none',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#000000', // Black background
                    color: '#FF8C00', // Orange text for fallback
                    fontWeight: 'bold',
                    fontSize: '16px',
                    fontFamily: "'Montserrat', sans-serif",
                    borderRadius: '8px'
                  }}>
                    
                  </div>
                </div>
              </a>
            </div>

            {/* Navigation Links */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '0 5px',
              justifyContent: 'center'
            }}>
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  style={{
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '12px 15px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid #333',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    fontFamily: "'Montserrat', sans-serif",
                    minHeight: '50px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    justifyContent: 'flex-start',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 140, 0, 0.2)';
                    e.target.style.border = '1px solid #FF8C00';
                    e.target.style.transform = 'translateX(3px)';
                    e.target.style.boxShadow = '0 3px 12px rgba(255, 140, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.border = '1px solid #333';
                    e.target.style.transform = 'translateX(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {link.name}
                  </span>
                </a>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '8px',
              marginTop: '20px',
              padding: '15px 5px 5px 5px',
              borderTop: '1px solid #333'
            }}>
              <button
                onClick={openSearch}
                style={{
                  padding: '12px 15px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #444',
                  color: '#FF8C00',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontFamily: "'Montserrat', sans-serif",
                  minHeight: '50px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 140, 0, 0.2)';
                  e.target.style.border = '1px solid #FF8C00';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 3px 12px rgba(255, 140, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.border = '1px solid #444';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <span>Search</span>
              </button>

              <a
                href="/pricing"
                onClick={(e) => handleSmoothScroll(e, "/pricing")}
                style={{
                  padding: '12px 15px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '14px',
                  background: 'rgba(255, 140, 0, 0.2)',
                  border: '1px solid #FF8C00',
                  color: '#FF8C00',
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontFamily: "'Montserrat', sans-serif",
                  minHeight: '50px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 140, 0, 0.3)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 3px 12px rgba(255, 140, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 140, 0, 0.2)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <span>Pricing</span>
              </a>

              <button
                onClick={openPopup}
                style={{
                  padding: '14px 15px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '14px',
                  background: 'linear-gradient(135deg, #FF8C00, #FFD700, #FF6347)',
                  color: '#000',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontFamily: "'Montserrat', sans-serif",
                  minHeight: '50px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #FFA500, #FFDF00, #FF7F50)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 5px 15px rgba(255, 140, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #FF8C00, #FFD700, #FF6347)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <span>Free Audit</span>
              </button>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Horizontal Navbar */}
      <nav 
        className="lg:hidden fixed top-0 left-0 right-0 z-[999] transition-all duration-500"
        style={{
          background: 'rgba(0, 0, 0, 0.98)',
          backdropFilter: 'blur(15px)',
          borderBottom: '2px solid #FF8C00',
          width: '100%',
          boxShadow: '0 5px 25px rgba(255, 140, 0, 0.15)'
        }}
      >
        <div className="px-4 sm:px-6" style={{ width: '100%' }}>
          <div className="flex items-center justify-between py-3" style={{ width: '100%' }}>
            {/* Mobile Logo - UPDATED WITH BORDER NONE AND BLACK COLOR */}
            <a href="#home" className="block">
              <div style={{
                width: '50px',
                height: '30px',
                borderRadius: '4px',
                background: '#000000', // Black background
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none', // Border removed
                boxShadow: '0 0 15px rgba(255, 140, 0, 0.5)',
                overflow: 'hidden'
              }}>
                <img 
                  src="/src/assets/comp-logo.png" 
                  alt="ADMARK Logo" 
                  style={{
                    width: '100%', // Full width according to space
                    height: '100%', // Full height according to space
                    objectFit: 'contain', // Fit the image properly
                    padding: '3px'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{
                  display: 'none',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#000000', // Black background
                  color: '#FF8C00', // Orange text for fallback
                  fontWeight: 'bold',
                  fontSize: '12px',
                  fontFamily: "'Montserrat', sans-serif",
                  borderRadius: '4px'
                }}>
                  AD
                </div>
              </div>
            </a>

            <div className="flex items-center gap-3">
              <button
                onClick={openSearch}
                className="p-3 rounded transition-all duration-300"
                aria-label="Search"
                style={{
                  color: '#FF8C00',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #444'
                }}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-3 rounded transition-all duration-300"
                aria-label="Toggle menu"
                style={{
                  color: '#FF8C00',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #444'
                }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div 
            style={{
              background: 'rgba(0, 0, 0, 0.98)',
              backdropFilter: 'blur(15px)',
              borderBottom: '2px solid #FF8C00',
              width: '100%'
            }}
          >
            <div className="px-4 pt-3 pb-6 space-y-3">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  onClick={(e) => {
                    handleSmoothScroll(e, link.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block px-4 py-3 rounded transition-all duration-300"
                  style={{
                    color: '#fff',
                    background: 'rgba(255, 255, 255, 0.08)',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: '1px solid #333',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontFamily: "'Montserrat', sans-serif",
                    minHeight: '50px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  {link.name}
                </a>
              ))}
              
              <a
                href="/pricing"
                onClick={(e) => {
                  handleSmoothScroll(e, "/pricing");
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full px-4 py-3 rounded transition-all duration-300"
                style={{
                  background: 'rgba(255, 140, 0, 0.2)',
                  color: '#FF8C00',
                  fontSize: '16px',
                  border: '1px solid #FF8C00',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontWeight: '700',
                  fontFamily: "'Montserrat', sans-serif",
                  minHeight: '50px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Pricing Plan
              </a>

              <button
                onClick={() => {
                  openPopup();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full px-4 py-3 rounded transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #FF8C00, #FFD700, #FF6347)',
                  color: '#000',
                  fontSize: '16px',
                  border: 'none',
                  marginTop: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontWeight: '700',
                  fontFamily: "'Montserrat', sans-serif",
                  minHeight: '50px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Free Audit
              </button>
            </div>
          </div>
        )}
      </nav>

      <FreeAuditPopup />
      <SearchPopup />

      {/* Add margin for desktop to account for sidebar */}
      <div className="hidden lg:block" style={{ 
        marginLeft: isSidebarExpanded ? '250px' : '0px',
        transition: 'margin-left 0.3s ease-in-out'
      }} />
      <div className="lg:hidden h-16" />
    </>
  );
}

// Main App Component
function App() {
  return (
    <div className="App">
      <Sidebar />
      <Hero />
      {/* Add other sections/components here as needed */}
    </div>
  );
}

export default App;