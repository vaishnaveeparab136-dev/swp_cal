document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('startDate').value = formattedDate;
    
    // Initialize charts
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    let monthlyChart = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Corpus Value',
                    data: [],
                    borderColor: '#2E5BFF',
                    backgroundColor: 'rgba(46, 91, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Cumulative Withdrawals',
                    data: [],
                    borderColor: '#00A86B',
                    backgroundColor: 'rgba(0, 168, 107, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly SWP Projection',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time Period (Months)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        }
                    }
                }
            }
        }
    });

    const yearlyCtx = document.getElementById('yearlyChart').getContext('2d');
    let yearlyChart = new Chart(yearlyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Corpus Value',
                    data: [],
                    borderColor: '#2E5BFF',
                    backgroundColor: 'rgba(46, 91, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Cumulative Withdrawals',
                    data: [],
                    borderColor: '#00A86B',
                    backgroundColor: 'rgba(0, 168, 107, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Yearly SWP Projection',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time Period (Years)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        }
                    }
                }
            }
        }
    });

    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to current tab and content
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Breakdown type selector functionality
    document.getElementById('monthlyBreakdownBtn').addEventListener('click', function() {
        document.getElementById('monthlyBreakdown').classList.add('active');
        document.getElementById('yearlyBreakdown').classList.remove('active');
        this.style.backgroundColor = 'var(--primary-color)';
        document.getElementById('yearlyBreakdownBtn').style.backgroundColor = 'var(--secondary-color)';
    });
    
    document.getElementById('yearlyBreakdownBtn').addEventListener('click', function() {
        document.getElementById('monthlyBreakdown').classList.remove('active');
        document.getElementById('yearlyBreakdown').classList.add('active');
        this.style.backgroundColor = 'var(--primary-color)';
        document.getElementById('monthlyBreakdownBtn').style.backgroundColor = 'var(--secondary-color)';
    });
    
    // Calculate button functionality
    document.getElementById('calculateBtn').addEventListener('click', calculateSWP);
    
    // Calculate nominal rate (equivalent to Excel's NOMINAL function)
    function nominalRate(effectiveRate, periods) {
        return periods * (Math.pow(1 + effectiveRate, 1/periods) - 1);
    }
    
    function calculateSWP() {
        // Get input values
        const startDateInput = document.getElementById('startDate').value;
        const annualReturnRate = parseFloat(document.getElementById('returnRate').value) / 100;
        const annualInflationRate = parseFloat(document.getElementById('inflationRate').value) / 100;
        const corpusAmount = parseFloat(document.getElementById('corpusAmount').value);
        const monthlySWP = parseFloat(document.getElementById('monthlySWP').value);
        
        // Validate inputs
        if (!startDateInput || isNaN(corpusAmount) || isNaN(monthlySWP) || 
            isNaN(annualReturnRate) || isNaN(annualInflationRate)) {
            alert('Please enter valid values for all fields');
            return;
        }
        
        // Parse start date
        const startDate = new Date(startDateInput);
        
        // Calculate monthly values
        const monthlyData = [];
        let currentValue = corpusAmount;
        let currentDate = new Date(startDate);
        let cumulativeWithdrawal = 0;
        let totalReturn = 0;
        
        // Calculate monthly return rate using nominal rate conversion (as in Excel)
        const monthlyReturnRate = nominalRate(annualReturnRate, 12) / 12;
        
        // Calculate for each month until corpus is exhausted
        let currentWithdrawal = monthlySWP;
        let monthCount = 0;
        
        while (currentValue > 0 && monthCount < 600) { // Maximum 50 years to prevent infinite loop
            const monthName = currentDate.toLocaleString('default', { month: 'short' });
            const year = currentDate.getFullYear();
            
            // Apply inflation adjustment at the beginning of each year (except first month)
            if (monthCount % 12 === 0 && monthCount > 0) {
                currentWithdrawal = currentWithdrawal * (1 + annualInflationRate);
            }
            
            // Cap withdrawal at remaining corpus (as in Excel)
            let actualWithdrawal = currentWithdrawal;
            if (actualWithdrawal > currentValue) {
                actualWithdrawal = currentValue;
            }
            
            // Calculate monthly return and ending value (as in Excel formula)
            const monthlyReturn = currentValue * monthlyReturnRate;
            const endingValue = (currentValue - actualWithdrawal) * (1 + monthlyReturnRate);
            
            // Update cumulative values
            cumulativeWithdrawal += actualWithdrawal;
            totalReturn += monthlyReturn;
            
            monthlyData.push({
                monthNumber: monthCount + 1,
                month: `${monthName}-${year.toString().slice(-2)}`,
                year: year,
                beginningValue: currentValue,
                monthlyReturn: monthlyReturn,
                withdrawal: actualWithdrawal,
                endingValue: endingValue
            });
            
            // Update for next iteration
            currentValue = endingValue;
            currentDate.setMonth(currentDate.getMonth() + 1);
            monthCount++;
            
            // Stop calculation if corpus is exhausted
            if (currentValue <= 0) {
                break;
            }
        }
        
        // Populate monthly table with exact column names from image
        const monthlyTableBody = document.getElementById('monthlyTableBody');
        monthlyTableBody.innerHTML = '';
        
        monthlyData.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.monthNumber}</td>
                <td>${data.month}</td>
                <td>${data.year}</td>
                <td>${formatCurrency(data.beginningValue)}</td>
                <td>${formatCurrency(data.withdrawal)}</td>
                <td>${(annualReturnRate * 100).toFixed(2)}%</td>
                <td class="${data.endingValue < 0 ? 'negative-value' : ''}">${formatCurrency(data.endingValue)}</td>
            `;
            monthlyTableBody.appendChild(row);
        });
        
        // Calculate yearly summary with exact column names from image
        const yearlyData = [];
        let yearStartValue = corpusAmount;
        let yearWithdrawal = 0;
        let yearReturn = 0;
        let currentYear = startDate.getFullYear();
        let yearCount = 0;
        
        for (let i = 0; i < monthlyData.length; i++) {
            const data = monthlyData[i];
            yearWithdrawal += data.withdrawal;
            yearReturn += data.monthlyReturn;
            
            // Check if we've completed a year or reached the end
            if ((i + 1) % 12 === 0 || i === monthlyData.length - 1) {
                yearlyData.push({
                    yearNumber: yearCount + 1,
                    year: currentYear,
                    beginningValue: yearStartValue,
                    withdrawal: yearWithdrawal,
                    return: yearReturn,
                    endingValue: data.endingValue
                });
                
                // Reset for next year
                yearStartValue = data.endingValue;
                yearWithdrawal = 0;
                yearReturn = 0;
                currentYear++;
                yearCount++;
            }
        }
        
        // Populate yearly table with exact column names from image
        const yearlyTableBody = document.getElementById('yearlyTableBody');
        yearlyTableBody.innerHTML = '';
        
        yearlyData.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.yearNumber}</td>
                <td>${data.year}</td>
                <td>${formatCurrency(data.beginningValue)}</td>
                <td>${formatCurrency(data.withdrawal)}</td>
                <td class="${data.endingValue < 0 ? 'negative-value' : ''}">${formatCurrency(data.endingValue)}</td>
            `;
            yearlyTableBody.appendChild(row);
        });
        
        // Update final value and result details
        const finalValue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].endingValue : corpusAmount;
        const swpDuration = (monthlyData.length / 12).toFixed(1);
        
        document.getElementById('finalValue').textContent = formatCurrency(finalValue);
        document.getElementById('totalWithdrawals').textContent = formatCurrency(cumulativeWithdrawal);
        document.getElementById('totalReturns').textContent = formatCurrency(totalReturn);
        document.getElementById('swpDuration').textContent = `${swpDuration} Years`;
        
        // Update charts
        updateMonthlyChart(monthlyData, cumulativeWithdrawal);
        updateYearlyChart(yearlyData, cumulativeWithdrawal);
        
        // Show results sections
        document.getElementById('resultsContainer').style.display = 'block';
        document.getElementById('resultsTabs').style.display = 'flex';
        document.getElementById('breakdown-tab').style.display = 'block';
        
        // Scroll to results
        document.getElementById('resultsContainer').scrollIntoView({ behavior: 'smooth' });
    }
    
    function updateMonthlyChart(monthlyData, cumulativeWithdrawal) {
        const labels = monthlyData.map(data => data.month);
        const corpusValues = monthlyData.map(data => data.endingValue);
        
        // Calculate cumulative withdrawals for each month
        let cumulativeWithdrawals = 0;
        const withdrawalData = monthlyData.map(data => {
            cumulativeWithdrawals += data.withdrawal;
            return cumulativeWithdrawals;
        });
        
        monthlyChart.data.labels = labels;
        monthlyChart.data.datasets[0].data = corpusValues;
        monthlyChart.data.datasets[1].data = withdrawalData;
        monthlyChart.update();
    }
    
    function updateYearlyChart(yearlyData, cumulativeWithdrawal) {
        const labels = yearlyData.map(data => `Year ${data.yearNumber}`);
        const corpusValues = yearlyData.map(data => data.endingValue);
        
        // Calculate cumulative withdrawals for each year
        let cumulativeWithdrawals = 0;
        const withdrawalData = yearlyData.map(data => {
            cumulativeWithdrawals += data.withdrawal;
            return cumulativeWithdrawals;
        });
        
        yearlyChart.data.labels = labels;
        yearlyChart.data.datasets[0].data = corpusValues;
        yearlyChart.data.datasets[1].data = withdrawalData;
        yearlyChart.update();
    }
    
    function formatCurrency(value) {
        // Format as Indian currency with commas
        if (value < 0) {
            return '-₹ ' + Math.abs(value).toLocaleString('en-IN', {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0
            });
        }
        return '₹ ' + value.toLocaleString('en-IN', {
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
        });
    }
    
    function formatCurrencyShort(value) {
        // Format large numbers with K, L, Cr suffixes
        if (value >= 10000000) {
            return '₹' + (value / 10000000).toFixed(1) + 'Cr';
        } else if (value >= 100000) {
            return '₹' + (value / 100000).toFixed(1) + 'L';
        } else if (value >= 1000) {
            return '₹' + (value / 1000).toFixed(1) + 'K';
        }
        return '₹' + value;
    }
});