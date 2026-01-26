import { Github, Linkedin, Mail } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const socialLinks = [
    { icon: () => <span className="text-lg font-bold">X</span>, href: "https://x.com/Brunopenzar", label: "Twitter" },
    { icon: Github, href: "https://github.com/BPenzar", label: "GitHub" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/bruno-penzar", label: "LinkedIn" },
    { icon: Mail, href: "mailto:bruno.penzar@bsp-lab.dev", label: "Email" },
  ]

  return (
    <footer className="border-t bg-gray-50 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:grid md:grid-cols-3 items-center gap-2 md:gap-4">
          <p className="text-sm text-gray-600 md:justify-self-start">
            © {currentYear}{" "}
            <a
              href="https://www.bsp-lab.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
            >
              BSP Lab
            </a>
          </p>

          <div className="md:justify-self-center">
            <a
              href="https://qr.bsp-lab.dev/f/Cz2VJ5Pe"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400"
            >
              Feedback
            </a>
          </div>

          <div className="flex gap-3 md:justify-self-end">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
