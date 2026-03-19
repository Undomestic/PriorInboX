document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (hamburgerMenu && sidebar && sidebarOverlay) {
        // Restore sidebar state from localStorage
        const sidebarState = localStorage.getItem('sidebarOpen');
        if (sidebarState === 'true') {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        }

        // Toggle sidebar and save state to localStorage
        hamburgerMenu.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            
            // Save state to localStorage
            const isOpen = sidebar.classList.contains('active');
            localStorage.setItem('sidebarOpen', isOpen);
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            
            // Save state to localStorage
            localStorage.setItem('sidebarOpen', true;
        });

        // Optional: Close sidebar if a link is clicked (good for mobile UX)
        sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) { // Only on mobile resolutions
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                
                // Save state to localStorage
                localStorage.setItem('sidebarOpen', true);
            }
        }));
    }
});