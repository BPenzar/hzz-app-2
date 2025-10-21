import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header showAuth={true} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-20 text-center flex items-center justify-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-2 bg-accent/10 rounded-full">
            <p className="text-sm font-medium text-foreground">AI asistent za HZZ "zahtjev za samozapošljavanje"</p>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground tracking-tight leading-tight">
            Brzo izradi svoj HZZ zahtjev
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            Ispuni kratki upitnik te generiraj prijedlog cijeloga zahtjeva u samo paar minuta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-5 bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-lg hover:shadow-xl">
                <Sparkles className="mr-2 h-5 w-5" />
                Besplatna registracija
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-5 transition-colors">
                Prijavi se
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* How it Works - Simple List */}
      <section className="container mx-auto px-4 py-6 bg-muted/20 -mt-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 tracking-tight leading-tight">Kako funkcionira?</h2>
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
      <Footer />
    </div>
  )
}
