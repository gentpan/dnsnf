import { createFileRoute, Link } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { Badge, Card, CardContent, CardHeader } from '@/components/ui'
import { blogArticles } from '@/lib/blog'

export const Route = createFileRoute('/blog/')({
  component: BlogIndex,
})

function BlogIndex() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="DNS.NF blog"
        title="DNS Guides"
        body="Practical notes for understanding DNS records, reverse discovery, mail infrastructure, and DNSSEC posture."
        badge="Guides"
      />

      <div className="grid gap-4">
        {blogArticles.map((article) => (
          <Link
            key={article.slug}
            to="/blog/$slug"
            params={{ slug: article.slug }}
            className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/40 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <div className="flex flex-wrap items-center gap-2">
              <BookOpen className="h-4 w-4 text-sky-600" />
              <h2 className="text-lg font-semibold tracking-normal text-zinc-950">{article.title}</h2>
              <Badge>{article.readTime}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{article.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {article.keywords.slice(0, 4).map((keyword) => (
                <Badge key={keyword}>{keyword}</Badge>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="bg-zinc-50/60">
          <div className="text-sm font-medium">How These Guides Fit The Tools</div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-zinc-600">
            Each query tool links back to the most relevant guide so users can understand the purpose of the lookup before interpreting results.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
