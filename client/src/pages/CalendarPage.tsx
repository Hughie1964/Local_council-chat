import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CalendarIcon, Plus, Clock, MapPin, Users } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';

// Sample event types and their colors
const eventTypes = {
  'meeting': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  'deadline': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  'rate_announcement': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  'maturity': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
};

// Sample mock events data
const sampleEvents = [
  {
    id: 1,
    title: 'Treasury Management Meeting',
    description: 'Quarterly review of investment performance and strategy adjustment',
    startTime: new Date(2025, 3, 12, 10, 0),
    endTime: new Date(2025, 3, 12, 11, 30),
    location: 'Council Chamber',
    eventType: 'meeting',
    isAllDay: false,
    attendees: [
      { id: 1, name: 'John Smith', status: 'accepted' },
      { id: 2, name: 'Jane Doe', status: 'pending' }
    ]
  },
  {
    id: 2,
    title: 'PWLB Loan Deadline',
    description: 'Final date to submit PWLB loan application for Q2 projects',
    startTime: new Date(2025, 3, 15),
    endTime: new Date(2025, 3, 15),
    location: null,
    eventType: 'deadline',
    isAllDay: true,
    attendees: []
  },
  {
    id: 3,
    title: 'Bank of England Rate Decision',
    description: 'MPC announcement on interest rates',
    startTime: new Date(2025, 3, 20, 12, 0),
    endTime: null,
    location: null,
    eventType: 'rate_announcement',
    isAllDay: false,
    attendees: []
  },
  {
    id: 4,
    title: 'Investment Maturity: DMADF £5M',
    description: 'Debt Management Account Deposit Facility investment matures',
    startTime: new Date(2025, 3, 22),
    endTime: new Date(2025, 3, 22),
    location: null,
    eventType: 'maturity',
    isAllDay: true,
    attendees: []
  }
];

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarView, setCalendarView] = useState<string>("month");
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" className="mr-4 p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Financial Calendar</h1>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">{date ? format(date, 'MMMM yyyy') : ''}</h2>
          <p className="text-muted-foreground">Manage your financial events and deadlines</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Event Types</h4>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs">Meeting</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-xs">Deadline</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs">Rate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-xs">Maturity</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">Today</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <CardTitle>Upcoming Events</CardTitle>
              </div>
              <CardDescription>
                Financial events and deadlines for your council
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleEvents.map(event => (
                  <div 
                    key={event.id}
                    className={`p-4 rounded-lg border ${eventTypes[event.eventType].border} ${eventTypes[event.eventType].bg}`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className={`font-medium ${eventTypes[event.eventType].text}`}>{event.title}</h3>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-white">
                        {event.eventType === 'meeting' ? 'Meeting' : 
                         event.eventType === 'deadline' ? 'Deadline' :
                         event.eventType === 'rate_announcement' ? 'Rate Announcement' : 'Maturity'}
                      </span>
                    </div>
                    
                    <p className="text-sm mt-1 text-gray-700">{event.description}</p>
                    
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center text-sm">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        {event.isAllDay ? (
                          <span>All day - {format(event.startTime, 'dd MMM yyyy')}</span>
                        ) : (
                          <span>
                            {format(event.startTime, 'dd MMM yyyy, h:mm a')}
                            {event.endTime ? ` - ${format(event.endTime, 'h:mm a')}` : ''}
                          </span>
                        )}
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                          {event.location}
                        </div>
                      )}
                      
                      {event.attendees.length > 0 && (
                        <div className="flex items-center text-sm">
                          <Users className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                          {event.attendees.length} attendees
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}