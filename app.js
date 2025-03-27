// DOM Elements
const daySelection = document.getElementById('day-selection');
const routineDisplay = document.getElementById('routine-display');
const dayTypeHeader = document.getElementById('day-type-header');
const scheduleBody = document.getElementById('schedule-body');
const currentTimeEl = document.getElementById('current-time');
const currentDateEl = document.getElementById('current-date');
const taskNameEl = document.getElementById('task-name');
const taskTimeEl = document.getElementById('task-time');
const nextTaskInfoEl = document.getElementById('next-task-info');
const snoozeBtn = document.getElementById('snooze-btn');
const completeBtn = document.getElementById('complete-btn');
const alarmSound = document.getElementById('alarm-sound');

// App state
let currentDayType = null;
let currentSchedule = [];
let activeTaskIndex = -1;
let nextTaskIndex = -1;
let alarmTimeout = null;
let clockInterval = null;

// Initialize the app
function init() {
    // Check for saved day type in local storage
    const savedDayType = localStorage.getItem('currentDayType');
    const lastResetDate = localStorage.getItem('lastResetDate');
    const todayDate = new Date().toDateString();

    // Check if we need to reset the day type (new day)
    if (lastResetDate !== todayDate) {
        // Reset day type at midnight
        localStorage.removeItem('currentDayType');
        localStorage.setItem('lastResetDate', todayDate);
        showDaySelection();
    } else if (savedDayType) {
        // Load saved day type for today
        loadDayType(savedDayType);
    } else {
        // No day type selected yet for today
        showDaySelection();
    }

    // Set up event listeners
    document.getElementById('college-day').addEventListener('click', () => selectDayType('college-day'));
    document.getElementById('non-college-day').addEventListener('click', () => selectDayType('non-college-day'));
    document.getElementById('alternate-college-day').addEventListener('click', () => selectDayType('alternate-college-day'));
    document.getElementById('change-day').addEventListener('click', showDaySelection);
    document.getElementById('reset-day').addEventListener('click', resetDayProgress);
    snoozeBtn.addEventListener('click', snoozeTask);
    completeBtn.addEventListener('click', completeTask);

    // Start the clock
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
}

// Show day selection screen
function showDaySelection() {
    daySelection.classList.remove('hidden');
    routineDisplay.classList.add('hidden');

    // Clear any active alarms
    if (alarmTimeout) {
        clearTimeout(alarmTimeout);
        alarmTimeout = null;
    }

    stopAlarm();
}

// Select day type
function selectDayType(dayType) {
    currentDayType = dayType;
    localStorage.setItem('currentDayType', dayType);
    loadDayType(dayType);
}

// Load the selected day type schedule
function loadDayType(dayType) {
    // Set the day type header
    let dayTypeText = '';
    switch (dayType) {
        case 'college-day':
            dayTypeText = 'College Day - 1';
            break;
        case 'non-college-day':
            dayTypeText = 'Non-College Day';
            break;
        case 'alternate-college-day':
            dayTypeText = 'College Day - 2';
            break;
    }
    dayTypeHeader.textContent = dayTypeText;

    // Load schedule from storage or initialize new one
    const savedSchedule = localStorage.getItem(`schedule-${dayType}`);

    if (savedSchedule) {
        currentSchedule = JSON.parse(savedSchedule);
        // Convert string dates back to Date objects
        currentSchedule.forEach(task => {
            task.startTime = task.startTime ? new Date(task.startTime) : null;
            task.endTime = task.endTime ? new Date(task.endTime) : null;
        });
    } else {
        // Clone the routine to avoid modifying the original
        currentSchedule = JSON.parse(JSON.stringify(processedRoutines[dayType]));
        // Convert string dates back to Date objects from processed routines
        currentSchedule.forEach((task, index) => {
            const originalTask = processedRoutines[dayType][index];
            task.startTime = originalTask.startTime ? new Date(originalTask.startTime.getTime()) : null;
            task.endTime = originalTask.endTime ? new Date(originalTask.endTime.getTime()) : null;
        });
    }

    // Render the schedule
    renderSchedule();
    updateTaskStatus();

    // Show the routine display
    daySelection.classList.add('hidden');
    routineDisplay.classList.remove('hidden');
}

// Render the schedule table
function renderSchedule() {
    scheduleBody.innerHTML = '';

    currentSchedule.forEach((task, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index;

        // Add class based on task status
        if (task.status === 'completed') {
            row.classList.add('task-completed');
        } else if (index === activeTaskIndex) {
            row.classList.add('task-active');
        }

        const timeCell = document.createElement('td');
        timeCell.textContent = task.time;

        const activityCell = document.createElement('td');
        activityCell.textContent = task.activity;

        const statusCell = document.createElement('td');

        // Create status content with a complete button for pending tasks
        if (task.status === 'pending' || task.status === 'active') {
            const statusText = document.createElement('span');
            statusText.textContent = capitalize(task.status);
            statusText.className = `status-${task.status}`;
            statusCell.appendChild(statusText);

            // Add a small button to mark task as complete
            const completeTaskBtn = document.createElement('button');
            completeTaskBtn.textContent = '✓';
            completeTaskBtn.className = 'small-btn';
            completeTaskBtn.style.marginLeft = '10px';
            completeTaskBtn.style.padding = '2px 5px';
            completeTaskBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                markTaskComplete(index);
            });
            statusCell.appendChild(completeTaskBtn);
        } else {
            statusCell.textContent = capitalize(task.status);
            statusCell.className = `status-${task.status}`;
        }

        row.appendChild(timeCell);
        row.appendChild(activityCell);
        row.appendChild(statusCell);

        scheduleBody.appendChild(row);
    });
}

// Function to mark any task as complete
function markTaskComplete(taskIndex) {
    if (taskIndex < 0 || taskIndex >= currentSchedule.length) return;

    // If the active task is being completed
    if (taskIndex === activeTaskIndex) {
        completeTask();
        return;
    }

    // Otherwise, just mark the task as complete
    currentSchedule[taskIndex].status = 'completed';

    // Save and update the UI
    saveSchedule();
    renderSchedule();
    updateTaskStatus();
}

// Update current and next task status
function updateTaskStatus() {
    const now = new Date();
    let foundActive = false;
    let foundNext = false;

    // Find the current active task and the next pending task
    for (let i = 0; i < currentSchedule.length; i++) {
        const task = currentSchedule[i];

        // Skip completed tasks
        if (task.status === 'completed') continue;

        // Check if this task is currently active
        if (!foundActive && task.startTime && (!task.endTime || now < task.endTime) && now >= task.startTime) {
            task.status = 'active';
            activeTaskIndex = i;
            foundActive = true;

            // Display current task info
            taskNameEl.textContent = task.activity;
            taskTimeEl.textContent = task.time;

            // Enable task controls
            snoozeBtn.disabled = false;
            completeBtn.disabled = false;

            // Set alarm for this task if not already set
            if (alarmTimeout === null) {
                // Only trigger alarm if the task just started (within the last minute)
                const taskJustStarted = (now - task.startTime) < 60000;
                if (taskJustStarted) {
                    triggerAlarm();
                }
            }
        }
        // Find the next pending task
        else if (foundActive && !foundNext && task.status === 'pending') {
            nextTaskIndex = i;
            foundNext = true;

            // Display next task info
            nextTaskInfoEl.textContent = `${task.activity} (${task.time})`;
        }
        // Reset tasks that are pending but not active or next
        else {
            if (task.status === 'active') {
                task.status = 'pending';
            }
        }
    }

    // If no active task found
    if (!foundActive) {
        activeTaskIndex = -1;
        taskNameEl.textContent = 'No active task';
        taskTimeEl.textContent = '--:-- - --:--';
        snoozeBtn.disabled = true;
        completeBtn.disabled = true;
        stopAlarm();
    }

    // If no next task found
    if (!foundNext) {
        nextTaskIndex = -1;
        nextTaskInfoEl.textContent = 'No upcoming tasks';
    }

    // Save the updated schedule
    saveSchedule();

    // Re-render the schedule
    renderSchedule();
}

// Snooze the current task
function snoozeTask() {
    if (activeTaskIndex === -1) return;

    stopAlarm();

    // Schedule the alarm to go off in 5 minutes
    alarmTimeout = setTimeout(triggerAlarm, 5 * 60 * 1000);

    // Show notification
    alert('Task snoozed for 5 minutes');
}

// Mark the current task as completed
function completeTask() {
    if (activeTaskIndex === -1) return;

    currentSchedule[activeTaskIndex].status = 'completed';
    activeTaskIndex = -1;

    stopAlarm();
    updateTaskStatus();
}

// Reset all tasks for the day
function resetDayProgress() {
    if (!currentDayType) return;

    // Reset all tasks to pending status
    currentSchedule.forEach(task => {
        task.status = 'pending';
    });

    // Reset active task
    activeTaskIndex = -1;
    nextTaskIndex = -1;

    // Stop any active alarms
    stopAlarm();
    if (alarmTimeout) {
        clearTimeout(alarmTimeout);
        alarmTimeout = null;
    }

    // Save and update UI
    saveSchedule();
    updateTaskStatus();

    // Show notification
    alert('Day progress has been reset');
}

// Trigger the alarm
function triggerAlarm() {
    alarmSound.currentTime = 0;
    alarmSound.loop = true;
    alarmSound.play().catch(error => {
        console.error('Error playing alarm:', error);
    });

    // Make the current task display pulse
    document.getElementById('current-task').classList.add('alert');

    // Clear the timeout
    alarmTimeout = null;
}

// Stop the alarm
function stopAlarm() {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    document.getElementById('current-task').classList.remove('alert');
}

// Update the clock display
function updateClock() {
    const now = new Date();

    // Update time
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    // Display in 12-hour format with AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    currentTimeEl.textContent = `${displayHours}:${minutes}:${seconds} ${ampm}`;

    // Update date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString(undefined, options);

    // Check if we need to update task status
    updateTaskStatus();

    // Check if we need to reset the day at midnight
    if (hours === '00' && minutes === '00' && seconds === '00') {
        localStorage.removeItem('currentDayType');
        localStorage.setItem('lastResetDate', now.toDateString());
        location.reload(); // Reload the page at midnight
    }
}

// Save the current schedule to local storage
function saveSchedule() {
    if (!currentDayType) return;

    localStorage.setItem(`schedule-${currentDayType}`, JSON.stringify(currentSchedule));
}

// Helper function to capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);