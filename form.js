const attendanceForm = document.getElementById('attendance-form');
const attendanceYearInput = document.getElementById('attendance-year-input');
const attendanceWeekInput = document.getElementById('attendance-week-input');
const attendanceEventInput = document.getElementById('attendance-event-input');

const populateSelectInput = (element, values, defaultValue) => {
  element.innerHTML =  Object.entries(values).map(([key, value]) => {
    return `
      <option value="${key}">${value}</option>
    `
  }).join('')
  element.value = defaultValue ? defaultValue : null;
};
const getWeekNumber = (d = new Date()) => {
  // Copy date so original date won't be modified
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  
  // Get first day of the year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  
  // Calculate days from the start of the year
  const dayOfYear = (d - yearStart + 86400000) / 86400000;
  
  // Return week number
  return Math.floor((dayOfYear - 1) / 7);
};
const getDateFromWeekNumber = (weekNum, year = new Date().getFullYear()) => {
  const startDate = new Date(year, 0, 1); // Start at January 1st of the specified year
  const daysOffset = (weekNum * 7) - (startDate.getDay() - 1); // Adjust according to the first day of the year

  startDate.setDate(startDate.getDate() + daysOffset);

  // Move to Saturday (6 is Saturday when 0 is Sunday)
  while (startDate.getDay() !== 6) {
    startDate.setDate(startDate.getDate() + 1);
  }

  return startDate;
};
formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based in JavaScript
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const getYears = () => {
  const yearsBack = 50;
  const currYear = new Date().getFullYear();
  return Array.from({ length: yearsBack }, (_, i) => currYear - i)
              .reduce((acc, year) => (acc[year] = year, acc), {});
};

const getWeeks = (year) => {
  const weeks = {};
  let currDate = new Date(year, 0, 1);

  while (currDate.getFullYear() === year) {
    if (currDate.getDay() === 6) { // Saturday
      const today = new Date(currDate);
      const tomorrow = new Date(year, currDate.getMonth(), currDate.getDate() + 1, 23, 59, 59);
      
      const weekID = getWeekNumber(today);
      const month = today.toLocaleDateString('en-us', { month: 'long' });
      const tomorrowMonth = tomorrow.toLocaleDateString('en-us', { month: 'long' });

      const weekString = `${month} ${today.getDate()} - ${month !== tomorrowMonth ? tomorrowMonth + ' ' : ''}${tomorrow.getDate()}`;
      
      weeks[weekID] = weekString;
    }
    currDate.setDate(currDate.getDate() + 1);
  }

  return weeks;
};

const getEvents = async (startDate, endDate) => {
  const filter = `Event_Start_Date BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}' AND Events.[Event_Type_ID] = 7 AND (Events.[Program_ID] = 509 OR Events.[Program_ID] = 568)`;
  const eventData = await MinistryPlatformAPI.request('get', '/tables/Events', {
    "$select": "Event_ID, Event_Title",
    "$filter": filter,
    "$orderby": "Program_ID, Event_Start_Date"
  });

  return eventData.reduce((acc, event) => {
    acc[event.Event_ID] = event.Event_Title;
    return acc;
  }, {});
};

const handleFormUpdate = () => {
  const currYear = parseInt(attendanceYearInput.value);
  const weeks = getWeeks(currYear);
  const weekNumber = parseInt(attendanceWeekInput.value);
  console.log(getDateFromWeekNumber(weekNumber));
};

// attendanceForm.addEventListener('input', handleFormUpdate);


(() => {
  const years = getYears();
  populateSelectInput(attendanceYearInput, years);
})();

attendanceYearInput.addEventListener('input', () => {
  const currYear = parseInt(attendanceYearInput.value);
  const weeks = getWeeks(currYear);
  populateSelectInput(attendanceWeekInput, weeks);
});

attendanceWeekInput.addEventListener('input', async () => {
  const weekNumber = parseInt(attendanceWeekInput.value);
  const startDate = getDateFromWeekNumber(weekNumber);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, 23, 59, 59);
  const events = await getEvents(startDate, endDate);
  populateSelectInput(attendanceEventInput, events);
});