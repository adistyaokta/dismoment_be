import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CommentDto, CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Post } from './entities/post.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreatePostDto) {
    return this.prisma.post.create({ data });
  }

  findAll() {
    return this.prisma.post.findMany({
      include: {
        author: true,
        likedBy: {
          select: {
            id: true
          }
        },
        comments: {
          select: {
            content: true,
            id: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                name: true,
                avaUrl: true,
                id: true
              }
            }
          }
        }
      }
    });
  }

  getRecentPost() {
    return this.prisma.post.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      include: {
        author: true,
        likedBy: {
          select: {
            id: true
          }
        },
        comments: {
          select: {
            content: true,
            id: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                name: true,
                avaUrl: true,
                id: true
              }
            }
          }
        }
      }
    });
  }

  async getInfinitePosts(cursor: number | null, limit: number): Promise<{ data: Post[]; nextCursor: number | null }> {
    const where: Prisma.PostWhereInput = cursor ? { id: { lt: cursor } } : {};

    const posts = await this.prisma.post.findMany({
      where,
      include: {
        author: true,
        likedBy: {
          select: {
            id: true
          }
        },
        comments: {
          select: {
            content: true,
            id: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                name: true,
                avaUrl: true,
                id: true
              }
            }
          }
        }
      },
      orderBy: { id: 'desc' },
      take: limit + 1
    });

    let nextCursor: number | null = null;
    if (posts.length > limit) {
      posts.pop();
      nextCursor = posts[posts.length - 1]?.id ?? null;
    }

    return { data: posts, nextCursor };
  }

  getMostLikedPosts() {
    return this.prisma.post.findMany({
      orderBy: [
        {
          likedBy: {
            _count: 'desc'
          }
        },
        {
          comments: {
            _count: 'desc'
          }
        }
      ],
      take: 3,
      include: {
        author: true,
        likedBy: {
          select: {
            id: true
          }
        },
        comments: {
          select: {
            content: true,
            id: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                name: true,
                avaUrl: true,
                id: true
              }
            }
          }
        }
      }
    });
  }

  getPostByAuthor(authorId: number) {
    return this.prisma.post.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      where: { authorId },
      include: {
        author: true,
        likedBy: {
          select: {
            id: true
          }
        },
        comments: {
          select: {
            content: true,
            id: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                name: true,
                avaUrl: true,
                id: true
              }
            }
          }
        }
      }
    });
  }

  async getPostWithMedia() {
    return this.prisma.post.findMany({
      where: {
        NOT: {
          media: null
        }
      },
      include: {
        author: {
          select: {
            username: true,
            avaUrl: true,
            name: true,
            id: true
          }
        },
        likedBy: {
          select: {
            id: true
          }
        },
        comments: {
          select: {
            content: true,
            id: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                name: true,
                avaUrl: true,
                id: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            username: true,
            avaUrl: true,
            name: true,
            id: true
          }
        },
        likedBy: {
          select: {
            id: true
          }
        },
        comments: {
          select: {
            content: true,
            id: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                name: true,
                avaUrl: true,
                id: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
  }

  // getRandomPost(count: number) {
  //   return this.prisma.$queryRaw`
  //     SELECT
  //       posts.*,
  //       json_build_object(
  //         'name', users.name,
  //         'username', users.username,
  //         'avaUrl', users.avaUrl
  //       ) AS author
  //     FROM posts
  //     INNER JOIN users ON posts."authorId" = users.id
  //     ORDER BY RANDOM()
  //     LIMIT ${count}`;
  // }

  async searchPosts(s: string) {
    return this.prisma.post.findMany({
      where: {
        OR: [
          {
            caption: {
              search: s
            }
          },
          {
            author: {
              name: {
                search: s
              }
            }
          },
          {
            author: {
              username: {
                search: s
              }
            }
          }
        ]
      },
      include: {
        author: {
          select: {
            username: true,
            avaUrl: true,
            name: true,
            id: true
          }
        },
        likedBy: {
          select: {
            id: true
          }
        },
        comments: {
          select: {
            content: true,
            id: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                name: true,
                avaUrl: true,
                id: true
              }
            }
          }
        }
      },
      orderBy: {
        _relevance: {
          fields: ['caption'],
          search: s,
          sort: 'asc'
        }
      }
    });
  }

  update(id: number, data: UpdatePostDto) {
    return this.prisma.post.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.post.delete({ where: { id } });
  }

  async likePost(userId: number, postId: number) {
    await Promise.all([this.checkIfPostExist(postId), this.checkIfUserExist(userId)]);

    return await this.prisma.post.update({
      where: {
        id: postId
      },
      data: {
        likedBy: {
          connect: {
            id: userId
          }
        }
      }
    });
  }

  async unlikePost(userId: number, postId: number) {
    await Promise.all([this.checkIfPostExist(postId), this.checkIfUserExist(userId)]);

    return await this.prisma.post.update({
      where: {
        id: postId
      },
      data: {
        likedBy: {
          disconnect: {
            id: userId
          }
        }
      }
    });
  }

  async checkIfPostExist(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId
      }
    });

    if (!post) throw new NotFoundException('Post not found!');
    return post;
  }

  async checkIfUserExist(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!user) throw new NotFoundException('User not found!');
    return user;
  }

  async checkIfCommentExist(commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId
      }
    });

    if (!comment) throw new NotFoundException('Comment not found!');
    return comment;
  }

  async getPostComments(postId: number) {
    await this.checkIfPostExist(postId);
    return await this.prisma.comment.findMany({
      where: {
        postId: postId
      }
    });
  }

  async addComment(userId: number, postId: number, data: CommentDto) {
    await Promise.all([this.checkIfPostExist(postId), this.checkIfUserExist(userId)]);

    return await this.prisma.post.update({
      where: {
        id: postId
      },
      data: {
        comments: {
          create: {
            ...data,
            authorId: userId
          }
        }
      }
    });
  }

  async deleteComment(commentId: number, postId: number, userId: number) {
    const comment = await this.checkIfCommentExist(commentId);

    if (comment.authorId !== userId || comment.postId !== postId) {
      throw new ForbiddenException('Access Denied!');
    }

    return await this.prisma.comment.delete({
      where: {
        id: commentId
      }
    });
  }
}
