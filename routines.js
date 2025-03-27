// Define the routines for each day type
const routines = {
    'college-day': [
        { time: '07:00 AM - 07:30 AM', activity: 'Wake up and water plants' },
        { time: '07:30 AM - 08:00 AM', activity: 'Bath and get ready' },
        { time: '08:00 AM - 01:30 PM', activity: 'College' },
        { time: '01:30 PM - 01:50 PM', activity: 'Lunch' },
        { time: '01:50 PM - 02:50 PM', activity: 'Placement Study' },
        { time: '08:00 PM - 10:00 PM', activity: 'Play time' },
        { time: '10:00 PM - 10:20 PM', activity: 'Dinner' },
        { time: '10:20 PM - 11:30 PM', activity: 'College study' },
        { time: '11:30 PM', activity: 'Bedtime' }
    ],
    'non-college-day': [
        { time: '07:00 AM - 07:30 AM', activity: 'Wake up and water plants' },
        { time: '07:30 AM - 08:00 AM', activity: 'Bath and get ready' },
        { time: '08:00 AM - 10:00 AM', activity: 'JAVA+DSA' },
        { time: '10:00 AM - 10:20 AM', activity: 'Breakfast' },
        { time: '10:20 AM - 11:10 AM', activity: 'Placement Theory Subject 1' },
        { time: '11:10 AM - 11:20 AM', activity: 'Break' },
        { time: '11:20 AM - 12:10 PM', activity: 'Placement Theory Subject 2' },
        { time: '12:10 PM - 12:20 PM', activity: 'Break' },
        { time: '12:20 PM - 01:30 PM', activity: 'Aptitude practice' },
        { time: '01:30 PM - 01:50 PM', activity: 'Lunch' },
        { time: '01:50 PM - 02:50 PM', activity: 'College study' },
        { time: '02:50 PM - 03:00 PM', activity: 'Break' },
        { time: '03:00 PM - 04:00 PM', activity: 'JAVA+DSA' },
        { time: '04:00 PM - 04:10 PM', activity: 'Break' },
        { time: '04:10 PM - 08:00 PM', activity: 'Flexible Time(Aptitude, Game Dev, Exercise)' },
        { time: '08:00 PM - 10:00 PM', activity: 'Play time' },
        { time: '10:00 PM - 10:20 PM', activity: 'Dinner' },
        { time: '10:20 PM - 11:30 PM', activity: 'College study' },
        { time: '11:30 PM', activity: 'Bedtime' }
    ],
    'alternate-college-day': [
        { time: '07:00 AM - 07:30 AM', activity: 'Wake up and water plants' },
        { time: '07:30 AM - 08:00 AM', activity: 'Bath and get ready' },
        { time: '08:00 AM - 10:00 AM', activity: 'Placement Study' },
        { time: '10:00 AM - 03:30 PM', activity: 'College' },
        { time: '03:30 PM - 03:50 PM', activity: 'Lunch' },
        { time: '03:50 PM - 08:00 PM', activity: 'Placement Study' },
        { time: '08:00 PM - 10:00 PM', activity: 'Play time' },
        { time: '10:00 PM - 10:20 PM', activity: 'Dinner' },
        { time: '10:20 PM - 11:30 PM', activity: 'College study' },
        { time: '11:30 PM', activity: 'Bedtime' }
    ]
};

// Helper function to parse time from string format to Date object
function parseTimeString(timeStr) {
    // Handle special case for bedtime which might just have the start time
    if (!timeStr.includes('-')) {
        // For single time like "11:30 PM"
        const timeParts = timeStr.trim().split(' ');
        const timeValue = timeParts[0];
        const meridian = timeParts[1] || 'AM'; // Default to AM if not specified

        const [hours, minutes] = timeValue.split(':').map(Number);
        const date = new Date();

        // Adjust hours for PM
        let adjustedHours = hours;
        if (meridian === 'PM' && hours < 12) {
            adjustedHours += 12;
        } else if (meridian === 'AM' && hours === 12) {
            adjustedHours = 0;
        }

        date.setHours(adjustedHours, minutes, 0, 0);
        return { start: date, end: null };
    }

    const [startStr, endStr] = timeStr.split(' - ');

    // Parse start time with meridian
    const startParts = startStr.trim().split(' ');
    const startTimeValue = startParts[0];
    const startMeridian = startParts[1] || 'AM'; // Default to AM if not specified

    const [startHours, startMinutes] = startTimeValue.split(':').map(Number);
    const startDate = new Date();

    // Adjust hours for PM
    let adjustedStartHours = startHours;
    if (startMeridian === 'PM' && startHours < 12) {
        adjustedStartHours += 12;
    } else if (startMeridian === 'AM' && startHours === 12) {
        adjustedStartHours = 0;
    }

    startDate.setHours(adjustedStartHours, startMinutes, 0, 0);

    // Handle case where end time might not exist (like for bedtime)
    if (!endStr) {
        return { start: startDate, end: null };
    }

    // Parse end time with meridian
    const endParts = endStr.trim().split(' ');
    const endTimeValue = endParts[0];
    const endMeridian = endParts[1] || startMeridian; // Default to same meridian as start time if not specified

    const [endHours, endMinutes] = endTimeValue.split(':').map(Number);
    const endDate = new Date();

    // Adjust hours for PM
    let adjustedEndHours = endHours;
    if (endMeridian === 'PM' && endHours < 12) {
        adjustedEndHours += 12;
    } else if (endMeridian === 'AM' && endHours === 12) {
        adjustedEndHours = 0;
    }

    endDate.setHours(adjustedEndHours, endMinutes, 0, 0);

    // Handle cases where the task crosses midnight
    if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
    }

    return { start: startDate, end: endDate };
}

// Convert a Date object to a time string with AM/PM format
function formatTimeWithAMPM(date) {
    if (!date) return '';

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12 for 12 AM

    return `${hours}:${minutes} ${ampm}`;
}

// Format a time range string based on start and end dates
function formatTimeRange(startDate, endDate) {
    const startTime = formatTimeWithAMPM(startDate);

    if (!endDate) {
        return startTime;
    }

    const endTime = formatTimeWithAMPM(endDate);
    return `${startTime} - ${endTime}`;
}

// Process routines to add start and end Date objects
function processRoutines() {
    const processedRoutines = {};

    for (const [dayType, tasks] of Object.entries(routines)) {
        processedRoutines[dayType] = tasks.map(task => {
            const { start, end } = parseTimeString(task.time);

            // Ensure the time format is consistent with AM/PM
            const formattedTime = formatTimeRange(start, end);

            return {
                activity: task.activity,
                time: formattedTime,
                startTime: start,
                endTime: end,
                status: 'pending'
            };
        });
    }

    return processedRoutines;
}

// Export the processed routines
const processedRoutines = processRoutines();