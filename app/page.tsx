import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FileText, Sparkles, Download, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Header showAuth={true} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          Brzo izradi svoj HZZ zahtjev
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Automatska priprema zahtjeva za samozapošljavanje uz AI podršku.
          Uštedi vrijeme i izbjegni greške.
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="text-lg px-8 py-6">
            <Sparkles className="mr-2 h-5 w-5" />
            Započni sada
          </Button>
        </Link>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Kako funkcionira?</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              step: '1',
              title: 'Registracija',
              description: 'Kreiraj besplatni račun i provjeri prihvatljivost',
              icon: CheckCircle2,
            },
            {
              step: '2',
              title: 'Unos podataka',
              description: 'Popuni formu kroz jednostavan wizard ili učitaj CV',
              icon: FileText,
            },
            {
              step: '3',
              title: 'AI generiranje',
              description: 'Automatski generiraj profesionalni prijedlog poslovanja',
              icon: Sparkles,
            },
            {
              step: '4',
              title: 'Izvoz',
              description: 'Preuzmi gotov PDF dokument spreman za podnošenje',
              icon: Download,
            },
          ].map((item) => (
            <Card key={item.step} className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12">Ključne funkcionalnosti</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: 'AI asistent',
              description: 'Automatsko generiranje poslovnog prijedloga korištenjem OpenAI tehnologije',
            },
            {
              title: 'Validacija u realnom vremenu',
              description: 'Trenutne provjere financijskih limita i dopuštenih troškova',
            },
            {
              title: 'PDF izvoz',
              description: 'Profesionalno formatiran dokument spreman za HZZ portal',
            },
            {
              title: 'CV parsing',
              description: 'Učitaj svoj CV i automatski popuni osnovne podatke',
            },
            {
              title: 'Višestruke prijave',
              description: 'Upravljaj i dupliciraj prijave prema potrebi',
            },
            {
              title: 'Sigurnost podataka',
              description: 'GDPR usklađeno skladištenje s Supabase bazom',
            },
          ].map((feature, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Spreman za početak?</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Pridruži se korisnicima koji su već ubrzali proces prijave
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="text-lg px-8 py-6">
            Započni besplatno
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  )
}
