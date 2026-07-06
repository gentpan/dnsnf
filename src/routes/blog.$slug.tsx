import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { PageHero } from '@/components/page-hero'
import { Badge, Card, CardContent, CardHeader } from '@/components/ui'
import { blogArticles, getBlogArticle, getRelatedArticles } from '@/lib/blog'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const article = getBlogArticle(params.slug)
    if (!article) throw notFound()
    return article
  },
  head: ({ loaderData }) => {
    const article = loaderData ?? blogArticles[0]!
    return {
      meta: seoMeta({
        title: `${article.title} | DNS.NF Blog`,
        description: article.description,
        keywords: article.keywords,
      }),
    }
  },
  component: BlogArticlePage,
})

function BlogArticlePage() {
  const article = Route.useLoaderData()
  const related = getRelatedArticles(article.category, 4).filter((item) => item.slug !== article.slug).slice(0, 3)

  return (
    <article className="space-y-6">
      <PageHero
        eyebrow="DNS.NF guide"
        title={article.title}
        body={article.description}
        badge={article.readTime}
        actions={
          <Link to="/blog" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 sm:w-fit">
            <ArrowLeft className="h-4 w-4" />
            Blog
          </Link>
        }
        meta={
          <div className="flex flex-wrap gap-2 p-5">
            {article.keywords.slice(0, 5).map((keyword) => (
              <Badge key={keyword}>{keyword}</Badge>
            ))}
          </div>
        }
      />

      <div className="space-y-4">
        {article.sections.map((section) => (
          <Card key={section.heading}>
            <CardHeader className="bg-zinc-50/60">
              <h2 className="text-sm font-medium">{section.heading}</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-zinc-600">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="bg-zinc-50/60">
          <div className="text-sm font-medium">More DNS.NF Guides</div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {related.map((item) => (
            <Link
              key={item.slug}
              to="/blog/$slug"
              params={{ slug: item.slug }}
              className="rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              <div className="text-sm font-semibold tracking-normal text-zinc-950">{item.title}</div>
              <div className="mt-1 text-sm leading-6 text-zinc-600">{item.description}</div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </article>
  )
}

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }))
}
