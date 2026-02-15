import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, FileText, Mail, Phone, MapPin } from "lucide-react";

export function CalendarView({ invoices, formatCurrency }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Group invoices by date
  const invoicesByDate = {};
  invoices.forEach(inv => {
    const date = new Date(inv.date);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      if (!invoicesByDate[day]) invoicesByDate[day] = [];
      invoicesByDate[day].push(inv);
    }
  });

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      invoices: []
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      invoices: invoicesByDate[day] || [],
      isToday: isToday(day)
    });
  }

  // Next month days to fill the grid
  const remainingDays = 42 - calendarDays.length; // 6 rows × 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      invoices: []
    });
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarIcon size={20} className="text-indigo-600" />
          {monthName}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-600 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-xs font-bold text-slate-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((dayData, index) => {
            const totalRevenue = dayData.invoices.reduce((sum, inv) => {
              return sum + (inv.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price)), 0);
            }, 0);

            const handleDayClick = (e) => {
              if (dayData.invoices.length > 0 && dayData.isCurrentMonth) {
                const rect = e.currentTarget.getBoundingClientRect();
                setClickPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                });
                setSelectedDay(dayData);
                setShowModal(true);
              }
            };

            return (
              <div
                key={index}
                onClick={handleDayClick}
                className={`min-h-[100px] p-2 border-b border-r border-slate-100 ${
                  !dayData.isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'
                } ${dayData.isToday ? 'bg-indigo-50' : ''} ${
                  dayData.invoices.length > 0 && dayData.isCurrentMonth ? 'cursor-pointer hover:bg-slate-50' : ''
                } transition-colors`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  !dayData.isCurrentMonth ? 'text-slate-400' : 
                  dayData.isToday ? 'text-indigo-600' : 'text-slate-700'
                }`}>
                  {dayData.day}
                </div>

                {dayData.invoices.length > 0 && (
                  <div className="space-y-1">
                    {dayData.invoices.slice(0, 2).map((inv, i) => (
                      <div
                        key={i}
                        className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded truncate"
                        title={`${inv.id} - ${inv.client?.name || 'Unknown'}`}
                      >
                        {inv.client?.name || 'Unknown'}
                      </div>
                    ))}
                    {dayData.invoices.length > 2 && (
                      <div className="text-xs text-slate-500 font-medium">
                        +{dayData.invoices.length - 2} more
                      </div>
                    )}
                    <div className="text-xs font-bold text-emerald-600 mt-1">
                      {formatCurrency(totalRevenue)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-50 border border-indigo-200 rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-100 rounded"></div>
          <span>Has Invoices</span>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {showModal && selectedDay && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-white/60 animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
            style={{
              transformOrigin: `${clickPosition.x}px ${clickPosition.y}px`,
              boxShadow: `
                inset 0 1px 0 0 rgba(255, 255, 255, 1),
                0 20px 60px -10px rgba(0, 0, 0, 0.15),
                0 10px 20px -5px rgba(0, 0, 0, 0.1)
              `
            }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-accent-primary via-accent-hover to-pink-700 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay.day).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </h2>
                  <p className="text-pink-100 font-medium">{selectedDay.invoices.length} invoice{selectedDay.invoices.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] custom-scrollbar">
              <div className="space-y-4">
                {selectedDay.invoices.map((invoice, index) => {
                  const total = (invoice.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price)), 0);
                  
                  return (
                    <div 
                      key={index} 
                      className="bg-white rounded-3xl p-5 border border-slate-200/60 hover:shadow-lg transition-all duration-300"
                      style={{
                        boxShadow: `
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.8),
                          0 10px 40px -10px rgba(0, 0, 0, 0.08),
                          0 4px 6px -1px rgba(0, 0, 0, 0.04)
                        `
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-pink-100 rounded-xl">
                            <FileText size={22} className="text-accent-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>{invoice.id}</h3>
                            <p className="text-sm text-slate-600 font-medium">{invoice.client?.name || 'Unknown Client'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-accent-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {formatCurrency(total)}
                          </p>
                          <span className={`inline-block text-xs px-3 py-1.5 rounded-full font-semibold mt-1 ${
                            invoice.status === 'paid' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {invoice.status || 'pending'}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      {invoice.items && invoice.items.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Items</p>
                          <div className="space-y-2">
                            {invoice.items.map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-sm bg-slate-50 rounded-xl px-3 py-2.5">
                                <span className="text-slate-700 font-medium">
                                  {item.description} <span className="text-slate-400 font-normal">× {item.quantity}</span>
                                </span>
                                <span className="font-bold text-slate-800">
                                  {formatCurrency(Number(item.quantity) * Number(item.price))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Client Details */}
                      {invoice.client && (invoice.client.email || invoice.client.phone || invoice.client.address) && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Client Details</p>
                          <div className="text-sm text-slate-600 space-y-2">
                            {invoice.client.email && (
                              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                                <Mail size={16} className="text-slate-400" />
                                <span className="font-medium">{invoice.client.email}</span>
                              </div>
                            )}
                            {invoice.client.phone && (
                              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                                <Phone size={16} className="text-slate-400" />
                                <span className="font-medium">{invoice.client.phone}</span>
                              </div>
                            )}
                            {invoice.client.address && (
                              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                                <MapPin size={16} className="text-slate-400" />
                                <span className="font-medium">{invoice.client.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50/80 backdrop-blur-sm px-6 py-4 border-t border-slate-200/60">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Total for this day</p>
                  <p className="text-xl font-bold text-emerald-600" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {formatCurrency(selectedDay.invoices.reduce((sum, inv) => {
                      return sum + (inv.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price)), 0);
                    }, 0))}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold border border-slate-200 transition-all hover:shadow-md active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
