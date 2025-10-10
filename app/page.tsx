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
      <section className="container mx-auto px-6 py-32 md:py-40 text-center flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-2 bg-accent/10 rounded-full">
            <p className="text-sm font-medium text-foreground">AI asistent za HZZ prijave</p>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 text-foreground tracking-tight leading-tight">
            Brzo izradi svoj<br />HZZ zahtjev za<br />samozapošljavanje
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Popuni formu, generiraj prijedlog poslovanja i preuzmi gotov PDF - sve u par minuta
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-10 py-7 rounded-full shadow-lg hover:shadow-xl transition-shadow">
                <Sparkles className="mr-2 h-5 w-5" />
                Započni besplatno
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-full">
                Prijavi se
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works - Simple List */}
      <section className="container mx-auto px-6 py-20 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">Kako funkcionira?</h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Registracija i provjera</h3>
                <p className="text-muted-foreground">Kreiraj račun i automatski provjeri jesil' prihvatljiv za program</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Unos podataka</h3>
                <p className="text-muted-foreground">Popuni formu ili učitaj svoj CV za automatsko popunjavanje</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI generiranje prijedloga</h3>
                <p className="text-muted-foreground">Automatski kreiraj profesionalni prijedlog poslovanja</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Preuzmi PDF</h3>
                <p className="text-muted-foreground">Gotov dokument spreman za upload na HZZ portal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6 py-32 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Spreman za početak?</h2>
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
            Uštedi vrijeme i izbjegni greške kod prijave
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-12 py-7 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <Sparkles className="mr-2 h-5 w-5" />
              Započni besplatno
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
