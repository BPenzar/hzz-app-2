import { Github, Linkedin, Mail } from "lucide-react"

export function Footer() {
  const socialLinks = [
    { icon: () => <span className="text-lg font-bold">X</span>, href: "https://x.com/Brunopenzar", label: "Twitter" },
    { icon: Github, href: "https://github.com/BPenzar", label: "GitHub" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/bruno-penzar", label: "LinkedIn" },
    { icon: Mail, href: "mailto:penzar.bruno@gmail.com", label: "Email" },
  ]

  return (
    <footer className="border-t bg-gray-50 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-sm text-gray-600">
            © 2025 {" "}
            <a
              href="https://www.bsp-lab.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
            >
              BSP Lab
            </a>
          </p>
          <div className="flex gap-3">
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
