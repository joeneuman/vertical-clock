class VerticalClock {
    constructor() {
        this.container = document.getElementById('timeBackground');
        this.viewportHeight = window.innerHeight;
        this.hoursRange = 3; // 3 hours visible
        this.pixelsPerHour = this.viewportHeight / this.hoursRange;
        this.pixelsPerMinute = this.pixelsPerHour / 60;
        this.pixelsPer15Minutes = this.pixelsPerHour / 4; // 15 minutes = 1/4 hour
        this.pixelsPerSecond = this.pixelsPerMinute / 60;
        this.pixelsPerMs = this.pixelsPerSecond / 1000;
        
        this.redLinePosition = 100; // 100px from top
        this.redLineTimeRatio = this.redLinePosition / this.viewportHeight;
        this.redLineElement = document.querySelector('.red-line');
        
        this.init();
        this.startAnimation();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.viewportHeight = window.innerHeight;
            this.pixelsPerHour = this.viewportHeight / this.hoursRange;
            this.pixelsPerMinute = this.pixelsPerHour / 60;
            this.pixelsPer15Minutes = this.pixelsPerHour / 4;
            this.pixelsPerSecond = this.pixelsPerMinute / 60;
            this.pixelsPerMs = this.pixelsPerSecond / 1000;
            this.redLineTimeRatio = this.redLinePosition / this.viewportHeight;
            this.updateMarkers();
            this.updateRedLinePosition();
        });
    }
    
    init() {
        this.updateMarkers();
    }
    
    updateRedLinePosition() {
        if (!this.redLineElement) {
            this.redLineElement = document.querySelector('.red-line');
        }
        if (!this.redLineElement) {
            console.error('Red line element not found');
            return;
        }
        
        try {
            // Create a temporary marker to measure text widths
            const tempMarker = this.createMarker(new Date(), 0);
            tempMarker.style.visibility = 'hidden';
            tempMarker.style.position = 'absolute';
            tempMarker.style.top = '-1000px';
            tempMarker.style.left = '0';
            tempMarker.style.width = '100%';
            document.body.appendChild(tempMarker);
            
            // Force layout calculation
            void tempMarker.offsetWidth;
            
            const timeText = tempMarker.querySelector('.time-text');
            const dateText = tempMarker.querySelector('.date-text');
            
            if (!timeText || !dateText) {
                document.body.removeChild(tempMarker);
                console.error('Time or date text not found');
                return;
            }
            
            // Get the computed widths
            const timeWidth = timeText.offsetWidth;
            const dateWidth = dateText.offsetWidth;
            const markerPadding = 20; // padding from CSS (padding: 4px 20px)
            
            // Calculate red line position
            // Start: left padding + time width + 10px
            // End: right edge - right padding - date width - 10px
            const leftPosition = markerPadding + timeWidth + 10;
            const rightPosition = markerPadding + dateWidth + 10;
            
            // Ensure valid positioning
            const viewportWidth = window.innerWidth;
            if (leftPosition >= 0 && rightPosition >= 0 && leftPosition < viewportWidth - rightPosition) {
                this.redLineElement.style.left = `${leftPosition}px`;
                this.redLineElement.style.right = `${rightPosition}px`;
                this.redLineElement.style.width = 'auto';
            } else {
                // Fallback: keep default full width if calculation fails
                this.redLineElement.style.left = '0';
                this.redLineElement.style.right = '0';
                this.redLineElement.style.width = '100%';
            }
            
            // Clean up
            document.body.removeChild(tempMarker);
        } catch (error) {
            console.error('Error updating red line position:', error);
        }
    }
    
    formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const hoursStr = hours.toString().padStart(2, '0');
        return `${hoursStr}:${minutes} ${ampm}`;
    }
    
    formatDate(date) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
    }
    
    createMarker(date, position) {
        const marker = document.createElement('div');
        marker.className = 'time-marker';
        marker.style.top = `${position}px`;
        
        const timeText = document.createElement('span');
        timeText.className = 'time-text';
        timeText.textContent = this.formatTime(date);
        
        const dateText = document.createElement('span');
        dateText.className = 'date-text';
        dateText.textContent = this.formatDate(date);
        
        marker.appendChild(timeText);
        marker.appendChild(dateText);
        
        return marker;
    }
    
    updateMarkers() {
        // Clear existing markers
        this.container.innerHTML = '';
        
        const now = new Date();
        const nowMs = now.getTime();
        
        // The red line at 100px shows the current time
        // Calculate what time should be at the top of the viewport
        // Top time = current time - (redLinePosition/viewportHeight * 3 hours)
        const topTimeOffsetMs = this.redLineTimeRatio * this.hoursRange * 60 * 60 * 1000;
        const topTimeMs = nowMs - topTimeOffsetMs;
        
        // Create markers covering a range from 1 hour before top to 4 hours after bottom
        // This ensures we have enough markers for smooth scrolling
        const startTimeMs = topTimeMs - (1 * 60 * 60 * 1000);
        const endTimeMs = topTimeMs + (5 * 60 * 60 * 1000); // 1 before + 3 visible + 1 after
        
        // Round start time to nearest 15-minute mark
        const startDate = new Date(startTimeMs);
        const startMinutes = startDate.getMinutes();
        const roundedStartMinutes = Math.floor(startMinutes / 15) * 15;
        const roundedStartDate = new Date(startDate);
        roundedStartDate.setMinutes(roundedStartMinutes);
        roundedStartDate.setSeconds(0);
        roundedStartDate.setMilliseconds(0);
        const roundedStartTimeMs = roundedStartDate.getTime();
        
        // Create markers every 15 minutes
        const markers = [];
        for (let timeMs = roundedStartTimeMs; timeMs <= endTimeMs; timeMs += 15 * 60 * 1000) {
            const date = new Date(timeMs);
            const position = ((timeMs - roundedStartTimeMs) / (15 * 60 * 1000)) * this.pixelsPer15Minutes;
            markers.push({ date, position });
        }
        
        // Add markers to container
        markers.forEach(({ date, position }) => {
            const marker = this.createMarker(date, position);
            this.container.appendChild(marker);
        });
        
        this.updateTransform();
        // Update red line position after markers are created
        if (this.redLineElement) {
            setTimeout(() => this.updateRedLinePosition(), 10);
        }
    }
    
    updateTransform() {
        const now = new Date();
        const nowMs = now.getTime();
        
        // Calculate what time should be at the top of the viewport
        const topTimeOffsetMs = this.redLineTimeRatio * this.hoursRange * 60 * 60 * 1000;
        const topTimeMs = nowMs - topTimeOffsetMs;
        
        // Find the start time of our marker range (1 hour before top time, rounded to 15 minutes)
        const startDate = new Date(topTimeMs - (1 * 60 * 60 * 1000));
        const startMinutes = startDate.getMinutes();
        const roundedStartMinutes = Math.floor(startMinutes / 15) * 15;
        const roundedStartDate = new Date(startDate);
        roundedStartDate.setMinutes(roundedStartMinutes);
        roundedStartDate.setSeconds(0);
        roundedStartDate.setMilliseconds(0);
        const startTimeMs = roundedStartDate.getTime();
        
        // Calculate where the top time marker should be positioned
        const topTimePosition = ((topTimeMs - startTimeMs) / (15 * 60 * 1000)) * this.pixelsPer15Minutes;
        
        // Scroll so that the top time appears at the top of the viewport (0px)
        const scrollY = -topTimePosition;
        
        this.container.style.transform = `translateY(${scrollY}px)`;
    }
    
    animate() {
        this.updateTransform();
        this.animationFrame = requestAnimationFrame(() => this.animate());
        
        // Periodically update markers to keep them in range
        const now = new Date();
        if (!this.lastMarkerUpdate || now - this.lastMarkerUpdate > 60 * 60 * 1000) {
            this.updateMarkers();
            this.lastMarkerUpdate = now;
        }
    }
    
    startAnimation() {
        this.lastMarkerUpdate = new Date();
        this.animate();
    }
}

// Initialize the clock when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new VerticalClock();
});

