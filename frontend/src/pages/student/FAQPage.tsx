import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'How do I book a seat?', a: 'Go to "Book Seat" from the dashboard, select your subject, time slot, and pick an available seat. Confirm your booking and you\'re all set!' },
  { q: 'Can I cancel a booking?', a: 'Yes. Go to "My Bookings", find the upcoming booking, and click "Cancel". Cancelled seats become available for others.' },
  { q: 'What does the QR code do?', a: 'The QR code contains your booking details. Show it at the exam hall entrance for verification by the invigilator.' },
  { q: 'What if my preferred seat is taken?', a: 'Choose any other available (green) seat. Seats are first-come, first-served.' },
  { q: 'How early can I book?', a: 'Bookings open as soon as the admin creates time slots. Check back regularly for new slots.' },
  { q: 'Who do I contact for issues?', a: 'Reach out to your department exam coordinator or email support@sec.edu.' },
];

export default function FAQPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Help & FAQ</h1>
        <p className="text-sm text-muted-foreground mt-1">Frequently asked questions about the slot booking system.</p>
      </div>
      <Card className="max-w-2xl">
        <CardContent className="py-4">
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
