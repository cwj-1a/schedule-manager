let schedules = [];
let isLoggedIn = false;

const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// 管理员账户信息（实际应用中应该存储在服务器端）
const adminCredentials = {
    username: 'admin',
    password: 'admin123'
};

document.addEventListener('DOMContentLoaded', function() {
    initializeLogin();
    checkLoginStatus();
});

function initializeLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    
    if (username === adminCredentials.username && password === adminCredentials.password) {
        // 登录成功
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        
        // 隐藏登录页面，显示应用容器
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        
        // 初始化应用功能
        initializeApp();
        
        showNotification('登录成功！欢迎回来，管理员。');
    } else {
        // 登录失败
        errorElement.textContent = '用户名或密码错误，请重试。';
        setTimeout(() => {
            errorElement.textContent = '';
        }, 3000);
    }
}

function checkLoginStatus() {
    const savedStatus = localStorage.getItem('isLoggedIn');
    if (savedStatus === 'true') {
        // 已登录状态
        isLoggedIn = true;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        initializeApp();
    }
}

function initializeApp() {
    initializeForm();
    loadSchedules();
    renderSchedules();
    initializeTabs();
    renderHistorySchedules();
    updateHistoryStats();
}

function logout() {
    if (confirm('确定要退出登录吗？')) {
        isLoggedIn = false;
        localStorage.removeItem('isLoggedIn');
        
        // 显示登录页面，隐藏应用容器
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        
        // 重置登录表单
        document.getElementById('loginForm').reset();
        document.getElementById('loginError').textContent = '';
        
        showNotification('已成功退出登录。');
    }
}

function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(tabId + 'Tab').classList.add('active');

            if (tabId === 'history') {
                renderHistorySchedules();
                updateHistoryStats();
            }
        });
    });
}

function initializeForm() {
    const today = new Date();
    document.getElementById('year').value = today.getFullYear();
    document.getElementById('month').value = today.getMonth() + 1;
    document.getElementById('day').value = today.getDate();
    document.getElementById('weekday').value = today.getDay();

    document.getElementById('month').addEventListener('change', function() {
        updateMaxDay();
        updateWeekday();
    });
    document.getElementById('year').addEventListener('change', function() {
        updateMaxDay();
        updateWeekday();
    });
    document.getElementById('day').addEventListener('change', updateWeekday);

    document.getElementById('scheduleForm').addEventListener('submit', handleSubmit);
}

function updateMaxDay() {
    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
    const dayInput = document.getElementById('day');

    if (year && month) {
        const maxDay = new Date(year, month, 0).getDate();
        dayInput.max = maxDay;
        
        if (parseInt(dayInput.value) > maxDay) {
            dayInput.value = maxDay;
        }
    }
}

function updateWeekday() {
    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
    const day = parseInt(document.getElementById('day').value);

    if (year && month && day) {
        const date = new Date(year, month - 1, day);
        document.getElementById('weekday').value = date.getDay();
    }
}

function handleSubmit(e) {
    e.preventDefault();

    const schedule = {
        id: Date.now(),
        year: parseInt(document.getElementById('year').value),
        month: parseInt(document.getElementById('month').value),
        day: parseInt(document.getElementById('day').value),
        weekday: parseInt(document.getElementById('weekday').value),
        person: document.getElementById('person').value.trim(),
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        notes: document.getElementById('notes').value.trim()
    };

    if (!validateSchedule(schedule)) {
        return;
    }

    schedules.push(schedule);
    saveSchedules();
    renderSchedules();
    
    const historyTab = document.getElementById('historyTab');
    if (historyTab.classList.contains('active')) {
        renderHistorySchedules();
        updateHistoryStats();
    }
    
    resetForm();

    showNotification('排班添加成功！');
}

function validateSchedule(schedule) {
    if (schedule.startTime >= schedule.endTime) {
        showNotification('结束时间必须晚于开始时间！', 'error');
        return false;
    }

    const conflicts = schedules.filter(s => 
        s.id !== schedule.id &&
        s.year === schedule.year &&
        s.month === schedule.month &&
        s.day === schedule.day &&
        s.person === schedule.person &&
        ((schedule.startTime >= s.startTime && schedule.startTime < s.endTime) ||
         (schedule.endTime > s.startTime && schedule.endTime <= s.endTime) ||
         (schedule.startTime <= s.startTime && schedule.endTime >= s.endTime))
    );

    if (conflicts.length > 0) {
        let conflictMessage = `该人员在此时间段已有排班冲突：\n\n`;
        conflicts.forEach((conflict, index) => {
            conflictMessage += `${index + 1}. ${conflict.year}年${conflict.month}月${conflict.day}日 ${weekdayNames[conflict.weekday]}\n`;
            conflictMessage += `   时间：${conflict.startTime} - ${conflict.endTime}\n`;
            if (conflict.notes) {
                conflictMessage += `   备注：${conflict.notes}\n`;
            }
            conflictMessage += '\n';
        });
        conflictMessage += '请调整时间段或删除冲突的排班。';
        
        alert(conflictMessage);
        return false;
    }

    return true;
}

function saveSchedules() {
    localStorage.setItem('schedules', JSON.stringify(schedules));
}

function loadSchedules() {
    const saved = localStorage.getItem('schedules');
    if (saved) {
        schedules = JSON.parse(saved);
    }
}

function renderSchedules(filteredSchedules = null) {
    const listContainer = document.getElementById('scheduleList');
    const displaySchedules = filteredSchedules || schedules;

    if (displaySchedules.length === 0) {
        listContainer.innerHTML = '<p class="no-data">暂无排班记录</p>';
        return;
    }

    const now = new Date();
    const pastSchedules = [];
    const futureSchedules = [];

    displaySchedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.year, schedule.month - 1, schedule.day);
        const [endHour, endMinute] = schedule.endTime.split(':');
        scheduleDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
        
        if (scheduleDate < now) {
            pastSchedules.push(schedule);
        } else {
            futureSchedules.push(schedule);
        }
    });

    const sortedPastSchedules = [...pastSchedules].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.month !== b.month) return b.month - a.month;
        if (a.day !== b.day) return b.day - a.day;
        return b.startTime.localeCompare(a.startTime);
    });

    const sortedFutureSchedules = [...futureSchedules].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        if (a.day !== b.day) return a.day - b.day;
        return a.startTime.localeCompare(b.startTime);
    });

    let html = '';

    if (futureSchedules.length > 0) {
        html += `
            <div class="schedule-section">
                <h3 class="section-title future">未来排班</h3>
                <div class="schedule-group">
                    ${sortedFutureSchedules.map(schedule => `
                        <div class="schedule-item future" data-id="${schedule.id}">
                            <div class="schedule-header">
                                <div class="schedule-date">${schedule.year}年${schedule.month}月${schedule.day}日</div>
                                <div class="schedule-weekday">${weekdayNames[schedule.weekday]}</div>
                            </div>
                            <div class="schedule-details">
                                <div class="detail-item">
                                    <strong>人员：</strong>${escapeHtml(schedule.person)}
                                </div>
                                <div class="detail-item">
                                    <strong>时间：</strong>
                                    <span class="schedule-time">${schedule.startTime} - ${schedule.endTime}</span>
                                </div>
                            </div>
                            ${schedule.notes ? `<div class="schedule-notes"><strong>备注：</strong>${escapeHtml(schedule.notes)}</div>` : ''}
                            <div class="schedule-actions">
                                <button class="btn-delete" onclick="deleteSchedule(${schedule.id})">删除</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (pastSchedules.length > 0) {
        html += `
            <div class="schedule-section">
                <h3 class="section-title past">历史排班</h3>
                <div class="schedule-group">
                    ${sortedPastSchedules.map(schedule => `
                        <div class="schedule-item past" data-id="${schedule.id}">
                            <div class="schedule-header">
                                <div class="schedule-date">${schedule.year}年${schedule.month}月${schedule.day}日</div>
                                <div class="schedule-weekday">${weekdayNames[schedule.weekday]}</div>
                            </div>
                            <div class="schedule-details">
                                <div class="detail-item">
                                    <strong>人员：</strong>${escapeHtml(schedule.person)}
                                </div>
                                <div class="detail-item">
                                    <strong>时间：</strong>
                                    <span class="schedule-time">${schedule.startTime} - ${schedule.endTime}</span>
                                </div>
                            </div>
                            ${schedule.notes ? `<div class="schedule-notes"><strong>备注：</strong>${escapeHtml(schedule.notes)}</div>` : ''}
                            <div class="schedule-actions">
                                <button class="btn-delete" onclick="deleteSchedule(${schedule.id})">删除</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    listContainer.innerHTML = html;
}

function deleteSchedule(id) {
    if (confirm('确定要删除这条排班记录吗？')) {
        schedules = schedules.filter(s => s.id !== id);
        saveSchedules();
        renderSchedules();
        
        const historyTab = document.getElementById('historyTab');
        if (historyTab.classList.contains('active')) {
            renderHistorySchedules();
            updateHistoryStats();
        }
        
        showNotification('排班删除成功！');
    }
}

function filterSchedules() {
    const filterYear = document.getElementById('filterYear').value;
    const filterMonth = document.getElementById('filterMonth').value;
    const filterDay = document.getElementById('filterDay').value;
    const filterPerson = document.getElementById('filterPerson').value.trim().toLowerCase();

    const filtered = schedules.filter(schedule => {
        const yearMatch = !filterYear || schedule.year === parseInt(filterYear);
        const monthMatch = !filterMonth || schedule.month === parseInt(filterMonth);
        const dayMatch = !filterDay || schedule.day === parseInt(filterDay);
        const personMatch = !filterPerson || schedule.person.toLowerCase().includes(filterPerson);
        
        return yearMatch && monthMatch && dayMatch && personMatch;
    });

    renderSchedules(filtered);
}

function resetFilter() {
    document.getElementById('filterYear').value = '';
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterDay').value = '';
    document.getElementById('filterPerson').value = '';
    renderSchedules();
}

function resetForm() {
    const personValue = document.getElementById('person').value;
    const notesValue = document.getElementById('notes').value;
    const startTimeValue = document.getElementById('startTime').value;
    const endTimeValue = document.getElementById('endTime').value;
    
    document.getElementById('scheduleForm').reset();
    const today = new Date();
    document.getElementById('year').value = today.getFullYear();
    document.getElementById('month').value = today.getMonth() + 1;
    document.getElementById('day').value = today.getDate();
    document.getElementById('weekday').value = today.getDay();
    
    document.getElementById('person').value = personValue;
    document.getElementById('notes').value = notesValue;
    document.getElementById('startTime').value = startTimeValue;
    document.getElementById('endTime').value = endTimeValue;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function getFilteredSchedules() {
    const filterYear = document.getElementById('filterYear').value;
    const filterMonth = document.getElementById('filterMonth').value;
    const filterDay = document.getElementById('filterDay').value;
    const filterPerson = document.getElementById('filterPerson').value.trim().toLowerCase();

    return schedules.filter(schedule => {
        const yearMatch = !filterYear || schedule.year === parseInt(filterYear);
        const monthMatch = !filterMonth || schedule.month === parseInt(filterMonth);
        const dayMatch = !filterDay || schedule.day === parseInt(filterDay);
        const personMatch = !filterPerson || schedule.person.toLowerCase().includes(filterPerson);
        
        return yearMatch && monthMatch && dayMatch && personMatch;
    }).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        if (a.day !== b.day) return a.day - b.day;
        return a.startTime.localeCompare(b.startTime);
    });
}

function exportToCSV() {
    const data = getFilteredSchedules();
    
    if (data.length === 0) {
        showNotification('没有可导出的数据！', 'error');
        return;
    }

    const headers = ['日期', '星期', '人员', '开始时间', '结束时间', '备注'];
    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`,
            weekdayNames[row.weekday],
            row.person,
            row.startTime,
            row.endTime,
            row.notes || ''
        ].map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, '排班表.csv', 'text/csv;charset=utf-8;');
    showNotification('CSV导出成功！');
}

function exportToExcel() {
    const data = getFilteredSchedules();
    
    if (data.length === 0) {
        showNotification('没有可导出的数据！', 'error');
        return;
    }

    const headers = ['日期', '星期', '人员', '开始时间', '结束时间', '备注'];
    const tableData = [headers, ...data.map(row => [
        `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`,
        weekdayNames[row.weekday],
        row.person,
        row.startTime,
        row.endTime,
        row.notes || ''
    ])];

    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><meta charset="UTF-8"><style>';
    excelContent += 'table { border-collapse: collapse; width: 100%; }';
    excelContent += 'td, th { border: 1px solid #000; padding: 8px; text-align: left; }';
    excelContent += 'th { background-color: #4CAF50; color: white; font-weight: bold; }';
    excelContent += '</style></head><body>';
    excelContent += '<table>';

    tableData.forEach((row, rowIndex) => {
        excelContent += '<tr>';
        row.forEach(cell => {
            const tag = rowIndex === 0 ? 'th' : 'td';
            excelContent += `<${tag}>${cell}</${tag}>`;
        });
        excelContent += '</tr>';
    });

    excelContent += '</table></body></html>';

    downloadFile(excelContent, '排班表.xls', 'application/vnd.ms-excel');
    showNotification('Excel导出成功！');
}

function exportToHTML() {
    const data = getFilteredSchedules();
    
    if (data.length === 0) {
        showNotification('没有可导出的数据！', 'error');
        return;
    }

    const today = new Date();
    const exportDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    let htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>排班表 - ${exportDate}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Microsoft YaHei', Arial, sans-serif; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            text-align: center; 
            color: #333; 
            margin-bottom: 10px;
            font-size: 28px;
        }
        .export-info {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            background: white;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 12px 15px; 
            text-align: left;
        }
        th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            font-weight: 600;
            text-transform: uppercase;
            font-size: 14px;
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f5f5f5; }
        .weekday { 
            background: #e3f2fd; 
            color: #1976d2;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
        }
        .time {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: 500;
        }
        .notes {
            color: #666;
            font-style: italic;
            font-size: 13px;
        }
        .summary {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .summary h3 {
            color: #333;
            margin-bottom: 15px;
        }
        .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .summary-item:last-child {
            border-bottom: none;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>排班表</h1>
        <div class="export-info">
            导出时间：${exportDate} | 总计：${data.length} 条排班记录
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>日期</th>
                    <th>星期</th>
                    <th>人员</th>
                    <th>工作时间</th>
                    <th>备注</th>
                </tr>
            </thead>
            <tbody>`;

    data.forEach(row => {
        htmlContent += `
                <tr>
                    <td>${row.year}年${row.month}月${row.day}日</td>
                    <td><span class="weekday">${weekdayNames[row.weekday]}</span></td>
                    <td><strong>${escapeHtml(row.person)}</strong></td>
                    <td><span class="time">${row.startTime} - ${row.endTime}</span></td>
                    <td class="notes">${row.notes ? escapeHtml(row.notes) : '-'}</td>
                </tr>`;
    });

    const personStats = {};
    data.forEach(row => {
        if (!personStats[row.person]) {
            personStats[row.person] = { count: 0, hours: 0 };
        }
        personStats[row.person].count++;
        
        const startParts = row.startTime.split(':');
        const endParts = row.endTime.split(':');
        const startHours = parseInt(startParts[0]) + parseInt(startParts[1]) / 60;
        const endHours = parseInt(endParts[0]) + parseInt(endParts[1]) / 60;
        personStats[row.person].hours += (endHours - startHours);
    });

    htmlContent += `
            </tbody>
        </table>
        
        <div class="summary">
            <h3>统计信息</h3>`;

    Object.entries(personStats).forEach(([person, stats]) => {
        htmlContent += `
            <div class="summary-item">
                <span><strong>${person}</strong></span>
                <span>排班 ${stats.count} 次 | 共 ${stats.hours.toFixed(1)} 小时</span>
            </div>`;
    });

    htmlContent += `
        </div>
    </div>
</body>
</html>`;

    downloadFile(htmlContent, '排班表.html', 'text/html;charset=utf-8');
    showNotification('HTML导出成功！');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function getHistoryFilteredSchedules() {
    const filterYear = document.getElementById('historyFilterYear').value;
    const filterMonth = document.getElementById('historyFilterMonth').value;
    const filterDay = document.getElementById('historyFilterDay').value;
    const filterPerson = document.getElementById('historyFilterPerson').value.trim().toLowerCase();

    return schedules.filter(schedule => {
        const yearMatch = !filterYear || schedule.year === parseInt(filterYear);
        const monthMatch = !filterMonth || schedule.month === parseInt(filterMonth);
        const dayMatch = !filterDay || schedule.day === parseInt(filterDay);
        const personMatch = !filterPerson || schedule.person.toLowerCase().includes(filterPerson);
        
        return yearMatch && monthMatch && dayMatch && personMatch;
    }).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        if (a.day !== b.day) return a.day - b.day;
        return a.startTime.localeCompare(b.startTime);
    });
}

function renderHistorySchedules() {
    const listContainer = document.getElementById('historyScheduleList');
    const displaySchedules = getHistoryFilteredSchedules();

    if (displaySchedules.length === 0) {
        listContainer.innerHTML = '<p class="no-data">暂无历史排班记录</p>';
        return;
    }

    listContainer.innerHTML = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>日期</th>
                    <th>星期</th>
                    <th>人员</th>
                    <th>工作时间</th>
                    <th>备注</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${displaySchedules.map(schedule => `
                    <tr>
                        <td>${schedule.year}年${schedule.month}月${schedule.day}日</td>
                        <td><span class="weekday-badge">${weekdayNames[schedule.weekday]}</span></td>
                        <td><strong>${escapeHtml(schedule.person)}</strong></td>
                        <td><span class="time-badge">${schedule.startTime} - ${schedule.endTime}</span></td>
                        <td class="notes-cell">${schedule.notes ? escapeHtml(schedule.notes) : '-'}</td>
                        <td>
                            <button class="btn-delete" onclick="deleteSchedule(${schedule.id})">删除</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function updateHistoryStats() {
    const data = getHistoryFilteredSchedules();
    
    const totalSchedules = data.length;
    const persons = [...new Set(data.map(s => s.person))];
    const totalPersons = persons.length;
    
    let totalHours = 0;
    data.forEach(schedule => {
        const startParts = schedule.startTime.split(':');
        const endParts = schedule.endTime.split(':');
        const startHours = parseInt(startParts[0]) + parseInt(startParts[1]) / 60;
        const endHours = parseInt(endParts[0]) + parseInt(endParts[1]) / 60;
        totalHours += (endHours - startHours);
    });

    document.getElementById('totalSchedules').textContent = totalSchedules;
    document.getElementById('totalPersons').textContent = totalPersons;
    document.getElementById('totalHours').textContent = totalHours.toFixed(1);
}

function filterHistorySchedules() {
    renderHistorySchedules();
    updateHistoryStats();
}

function resetHistoryFilter() {
    document.getElementById('historyFilterYear').value = '';
    document.getElementById('historyFilterMonth').value = '';
    document.getElementById('historyFilterDay').value = '';
    document.getElementById('historyFilterPerson').value = '';
    renderHistorySchedules();
    updateHistoryStats();
}

function exportHistoryToCSV() {
    const data = getHistoryFilteredSchedules();
    
    if (data.length === 0) {
        showNotification('没有可导出的数据！', 'error');
        return;
    }

    const headers = ['日期', '星期', '人员', '开始时间', '结束时间', '备注'];
    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`,
            weekdayNames[row.weekday],
            row.person,
            row.startTime,
            row.endTime,
            row.notes || ''
        ].map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, '历史排班表.csv', 'text/csv;charset=utf-8;');
    showNotification('历史排班CSV导出成功！');
}

function exportHistoryToExcel() {
    const data = getHistoryFilteredSchedules();
    
    if (data.length === 0) {
        showNotification('没有可导出的数据！', 'error');
        return;
    }

    const headers = ['日期', '星期', '人员', '开始时间', '结束时间', '备注'];
    const tableData = [headers, ...data.map(row => [
        `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`,
        weekdayNames[row.weekday],
        row.person,
        row.startTime,
        row.endTime,
        row.notes || ''
    ])];

    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><meta charset="UTF-8"><style>';
    excelContent += 'table { border-collapse: collapse; width: 100%; }';
    excelContent += 'td, th { border: 1px solid #000; padding: 8px; text-align: left; }';
    excelContent += 'th { background-color: #4CAF50; color: white; font-weight: bold; }';
    excelContent += '</style></head><body>';
    excelContent += '<table>';

    tableData.forEach((row, rowIndex) => {
        excelContent += '<tr>';
        row.forEach(cell => {
            const tag = rowIndex === 0 ? 'th' : 'td';
            excelContent += `<${tag}>${cell}</${tag}>`;
        });
        excelContent += '</tr>';
    });

    excelContent += '</table></body></html>';

    downloadFile(excelContent, '历史排班表.xls', 'application/vnd.ms-excel');
    showNotification('历史排班Excel导出成功！');
}

function exportHistoryToHTML() {
    const data = getHistoryFilteredSchedules();
    
    if (data.length === 0) {
        showNotification('没有可导出的数据！', 'error');
        return;
    }

    const today = new Date();
    const exportDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    let htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>历史排班表 - ${exportDate}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Microsoft YaHei', Arial, sans-serif; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            text-align: center; 
            color: #333; 
            margin-bottom: 10px;
            font-size: 28px;
        }
        .export-info {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .stats-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-item {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-item .number {
            font-size: 2em;
            font-weight: 700;
        }
        .stat-item .label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            background: white;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 12px 15px; 
            text-align: left;
        }
        th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            font-weight: 600;
            text-transform: uppercase;
            font-size: 14px;
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f5f5f5; }
        .weekday { 
            background: #e3f2fd; 
            color: #1976d2;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
        }
        .time {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: 500;
        }
        .notes {
            color: #666;
            font-style: italic;
            font-size: 13px;
        }
        .summary {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .summary h3 {
            color: #333;
            margin-bottom: 15px;
        }
        .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .summary-item:last-child {
            border-bottom: none;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>历史排班表</h1>
        <div class="export-info">
            导出时间：${exportDate} | 总计：${data.length} 条排班记录
        </div>
        
        <div class="stats-summary">
            <div class="stat-item">
                <div class="number">${data.length}</div>
                <div class="label">总排班数</div>
            </div>
            <div class="stat-item">
                <div class="number">${[...new Set(data.map(s => s.person))].length}</div>
                <div class="label">参与人数</div>
            </div>
            <div class="stat-item">
                <div class="number">${data.reduce((total, s) => {
                    const startParts = s.startTime.split(':');
                    const endParts = s.endTime.split(':');
                    const startHours = parseInt(startParts[0]) + parseInt(startParts[1]) / 60;
                    const endHours = parseInt(endParts[0]) + parseInt(endParts[1]) / 60;
                    return total + (endHours - startHours);
                }, 0).toFixed(1)}</div>
                <div class="label">总工时（小时）</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>日期</th>
                    <th>星期</th>
                    <th>人员</th>
                    <th>工作时间</th>
                    <th>备注</th>
                </tr>
            </thead>
            <tbody>`;

    data.forEach(row => {
        htmlContent += `
                <tr>
                    <td>${row.year}年${row.month}月${row.day}日</td>
                    <td><span class="weekday">${weekdayNames[row.weekday]}</span></td>
                    <td><strong>${escapeHtml(row.person)}</strong></td>
                    <td><span class="time">${row.startTime} - ${row.endTime}</span></td>
                    <td class="notes">${row.notes ? escapeHtml(row.notes) : '-'}</td>
                </tr>`;
    });

    const personStats = {};
    data.forEach(row => {
        if (!personStats[row.person]) {
            personStats[row.person] = { count: 0, hours: 0 };
        }
        personStats[row.person].count++;
        
        const startParts = row.startTime.split(':');
        const endParts = row.endTime.split(':');
        const startHours = parseInt(startParts[0]) + parseInt(startParts[1]) / 60;
        const endHours = parseInt(endParts[0]) + parseInt(endParts[1]) / 60;
        personStats[row.person].hours += (endHours - startHours);
    });

    htmlContent += `
            </tbody>
        </table>
        
        <div class="summary">
            <h3>人员统计</h3>`;

    Object.entries(personStats).forEach(([person, stats]) => {
        htmlContent += `
            <div class="summary-item">
                <span><strong>${person}</strong></span>
                <span>排班 ${stats.count} 次 | 共 ${stats.hours.toFixed(1)} 小时</span>
            </div>`;
    });

    htmlContent += `
        </div>
    </div>
</body>
</html>`;

    downloadFile(htmlContent, '历史排班表.html', 'text/html;charset=utf-8');
    showNotification('历史排班HTML导出成功！');
}