import styles from './styles.module.scss'
import Head from 'next/head'
import { GetStaticProps, NextApiRequest } from 'next';
import { createClient } from '../../services/prismic';
import * as Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Link from 'next/link';


type Posts = {
  slug: string,
  title: string,
  excerpt: string,
  updatedAt: string,
}

interface PostsProps {
  posts: Posts[]
}

export default function Posts( { posts }: PostsProps) {
  return (
    <>
      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.slug} href={`/posts/${post.slug}`}>
              <a>
                <time>{post.updatedAt}</time>
                <strong>{post.title}</strong>
                <p>{post.excerpt}</p>
              </a>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (req: NextApiRequest) => {
  
  const prismic = createClient();

  // Modo antigo de fazer
  // const response = await prismic.query([
  //   Prismic.predicates.at('document.type', 'My-Publications')
  // ], {
  //   fetch: ['publication.title', 'publication.content'],
  //   pageSize: 100
  // })

  // console.log(JSON.stringify(response, null, 2));
  
  const response = await prismic.getAllByType('My-Publications', { limit: 100 });

  // console.log(JSON.stringify(response, null, 2))
  
  const posts = response.map(post => {
    return {
      slug: post.uid,
      title: RichText.asText(post.data.Title),
      excerpt: post.data.Content.find((content) => content.type === 'paragraph')?.text ?? '',
      updatedAt: new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    };
  });
  
  
  

  return {
    props: {
      posts
    }
  }
}