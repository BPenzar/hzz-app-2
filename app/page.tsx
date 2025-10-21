import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sparkles, ArrowRight, Check, Zap, Bot } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header showAuth={true} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 md:py-12 text-center flex-1 flex items-center justify-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block mb-2 px-3 py-1 bg-accent/10 rounded-full">
            <p className="text-xs font-medium text-foreground">AI asistent za HZZ "zahtjev za samozapošljavanje"</p>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight leading-tight">
            Brzo izradi svoj HZZ zahtjev
          </h1>
          <p className="text-base text-muted-foreground mb-6 leading-relaxed max-w-xl mx-auto">
            Ispuni kratki upitnik te generiraj prijedlog cijeloga zahtjeva u samo paar minuta.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-base px-6 py-4 bg-foreground text-background hover:bg-foreground/90 transition-colors">
                <Sparkles className="mr-2 h-4 w-4" />
                Besplatna registracija
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-base px-6 py-4 transition-colors">
                Prijavi se
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works - Simple List */}
      <section className="container mx-auto px-4 py-6 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 tracking-tight leading-tight">Kako funkcionira?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="text-base font-semibold mb-1 leading-tight">Brza registracija</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Stvori račun i započni s izradom zahtjeva odmah</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="text-base font-semibold mb-1 leading-tight">Popuni strukturiranu formu</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Vođen postupak kroz sve potrebne sekcije zahtjeva</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="text-base font-semibold mb-1 leading-tight">AI pomoć za poslovni plan</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Generiraj profesionalni prijedlog poslovanja s AI asistentom</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="text-base font-semibold mb-1 leading-tight">Preuzmi u PDF ili DOCX</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Preuredi sekcije te preuzmi dokument</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold mb-1">100% besplatno</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Bez skrivenih troškova ili pretplata</p>
            </div>
            <div className="p-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold mb-1">Brže 10x</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Umjesto satima, završi za 15 minuta</p>
            </div>
            <div className="p-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bot className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold mb-1">AI asistent</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Profesionalni prijedlozi poslovanja</p>
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  )
}
