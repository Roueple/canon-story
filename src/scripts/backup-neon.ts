// src/scripts/backup-neon.ts
// Backup script that leverages Neon's branching feature

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

interface BackupOptions {
  createBranch?: boolean
  exportData?: boolean
  includeDeleted?: boolean
}

async function backupDatabase(options: BackupOptions = {}) {
  const { 
    createBranch = true, 
    exportData = true, 
    includeDeleted = false 
  } = options
  
  const backupDir = path.join(process.cwd(), 'backups')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(backupDir, `backup-${timestamp}`)

  try {
    console.log('🔒 Starting Neon database backup...')
    
    // Create backup directory
    await fs.mkdir(backupPath, { recursive: true })

    // Step 1: Create a Neon branch (if enabled)
    if (createBranch) {
      console.log('🌿 Creating Neon branch for backup...')
      // Note: This would typically use Neon's API
      // For now, log instructions
      console.log(`
⚠️  Manual step required:
1. Go to your Neon dashboard
2. Create a new branch named: backup-${timestamp}
3. This preserves your entire database state at this moment
      `)
    }

    // Step 2: Export data to JSON files
    if (exportData) {
      console.log('📦 Exporting database data...')

      // Define tables to backup with soft delete handling
      const tables = [
        { 
          name: 'users', 
          data: await prisma.user.findMany({
            where: includeDeleted ? {} : { isDeleted: false }
          })
        },
        { 
          name: 'novels', 
          data: await prisma.novel.findMany({
            where: includeDeleted ? {} : { isDeleted: false },
            include: {
              genres: { include: { genre: true } },
              tags: { include: { tag: true } }
            }
          })
        },
        { 
          name: 'chapters', 
          data: await prisma.chapter.findMany({
            where: includeDeleted ? {} : { isDeleted: false },
            include: {
              chapterMedia: { include: { media: true } }
            }
          })
        },
        { 
          name: 'genres', 
          data: await prisma.genre.findMany() 
        },
        { 
          name: 'tags', 
          data: await prisma.tag.findMany() 
        },
        { 
          name: 'comments', 
          data: await prisma.comment.findMany({
            where: includeDeleted ? {} : { isDeleted: false }
          })
        },
        { 
          name: 'ratings', 
          data: await prisma.rating.findMany() 
        },
        { 
          name: 'reviews', 
          data: await prisma.review.findMany({
            where: includeDeleted ? {} : { isDeleted: false }
          })
        },
        { 
          name: 'mediaFiles', 
          data: await prisma.mediaFile.findMany({
            where: includeDeleted ? {} : { isDeleted: false }
          })
        },
        { 
          name: 'auditLogs', 
          data: await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 10000 // Last 10k audit entries
          })
        },
        { 
          name: 'deletionLogs', 
          data: await prisma.deletionLog.findMany({
            where: { restorable: true }
          })
        }
      ]

      // Save each table to a JSON file
      for (const table of tables) {
        const filePath = path.join(backupPath, `${table.name}.json`)
        await fs.writeFile(
          filePath, 
          JSON.stringify(table.data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          , 2),
          'utf-8'
        )
        console.log(`✓ Backed up ${table.name}: ${table.data.length} records`)
      }
    }

    // Step 3: Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      neonBranch: createBranch ? `backup-${timestamp}` : null,
      includeDeleted,
      databaseUrl: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0], // Host only
      backupType: 'neon-branch-and-export',
      version: '2.0',
      statistics: {
        users: await prisma.user.count({ where: { isDeleted: false } }),
        novels: await prisma.novel.count({ where: { isDeleted: false } }),
        chapters: await prisma.chapter.count({ where: { isDeleted: false } }),
        deletedRecords: {
          users: await prisma.user.count({ where: { isDeleted: true } }),
          novels: await prisma.novel.count({ where: { isDeleted: true } }),
          chapters: await prisma.chapter.count({ where: { isDeleted: true } })
        }
      }
    }
    
    await fs.writeFile(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    )

    // Step 4: Log backup to database
    await prisma.backupLog.create({
      data: {
        filename: `backup-${timestamp}`,
        size: BigInt(0), // Calculate actual size if needed
        tables: metadata.statistics,
        location: createBranch ? 'neon-branch' : 'local',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date()
      }
    })

    console.log(`\n✅ Backup completed successfully!`)
    console.log(`📁 Local backup: ${backupPath}`)
    if (createBranch) {
      console.log(`🌿 Neon branch: backup-${timestamp}`)
    }

    // Optional: Clean old local backups (keep last 7 days)
    await cleanOldBackups(backupDir, 7)

  } catch (error) {
    console.error('❌ Backup failed:', error)
    
    // Log failure
    await prisma.backupLog.create({
      data: {
        filename: `backup-${timestamp}`,
        size: BigInt(0),
        tables: {},
        location: 'local',
        status: 'failed',
        startedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function cleanOldBackups(backupDir: string, daysToKeep: number) {
  try {
    const files = await fs.readdir(backupDir)
    const now = Date.now()
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000

    for (const file of files) {
      const filePath = path.join(backupDir, file)
      const stats = await fs.stat(filePath)
      
      if (stats.isDirectory() && now - stats.mtime.getTime() > maxAge) {
        await fs.rm(filePath, { recursive: true })
        console.log(`🗑️  Deleted old backup: ${file}`)
      }
    }
  } catch (error) {
    console.error('Error cleaning old backups:', error)
  }
}

// Restore function that leverages Neon branches
async function restoreFromNeonBranch(branchName: string) {
  console.log(`
⚠️  To restore from Neon branch:
1. Go to your Neon dashboard
2. Find branch: ${branchName}
3. You can either:
   - Switch your main branch to this backup
   - Create a new branch from this backup
   - Copy the connection string and update .env.local
  `)
}

// Restore from JSON backup
async function restoreFromBackup(backupPath: string, options: { dryRun?: boolean } = {}) {
  const { dryRun = true } = options
  
  try {
    console.log(`📥 Restoring from backup: ${backupPath}`)
    
    // Read metadata
    const metadata = JSON.parse(
      await fs.readFile(path.join(backupPath, 'metadata.json'), 'utf-8')
    )
    
    console.log(`Backup date: ${metadata.timestamp}`)
    console.log(`Includes deleted records: ${metadata.includeDeleted}`)
    
    if (dryRun) {
      console.log('🔍 DRY RUN - No changes will be made')
      
      // Analyze what would be restored
      const users = JSON.parse(
        await fs.readFile(path.join(backupPath, 'users.json'), 'utf-8')
      )
      const novels = JSON.parse(
        await fs.readFile(path.join(backupPath, 'novels.json'), 'utf-8')
      )
      const chapters = JSON.parse(
        await fs.readFile(path.join(backupPath, 'chapters.json'), 'utf-8')
      )
      
      console.log(`
Would restore:
- ${users.length} users
- ${novels.length} novels  
- ${chapters.length} chapters
      `)
      
      return
    }
    
    // Actual restore would go here
    console.log('⚠️  Full restore not implemented - use Neon branch restore instead')
    
  } catch (error) {
    console.error('❌ Restore failed:', error)
  }
}

// Command line interface
const command = process.argv[2]
const args = process.argv.slice(3)

switch (command) {
  case 'backup':
    backupDatabase({
      createBranch: !args.includes('--no-branch'),
      exportData: !args.includes('--no-export'),
      includeDeleted: args.includes('--include-deleted')
    })
    break
    
  case 'restore':
    if (args[0]) {
      restoreFromBackup(args[0], { dryRun: !args.includes('--execute') })
    } else {
      console.error('Please provide backup path')
    }
    break
    
  case 'restore-branch':
    if (args[0]) {
      restoreFromNeonBranch(args[0])
    } else {
      console.error('Please provide branch name')
    }
    break
    
  default:
    console.log(`
Neon Backup Script Usage:

  npm run backup                    Create full backup with Neon branch
  npm run backup -- --no-branch     Create local backup only
  npm run backup -- --include-deleted  Include soft-deleted records
  
  npm run restore <backup-path>     Analyze backup (dry run)
  npm run restore <backup-path> --execute  Restore from backup
  
  npm run restore-branch <branch-name>  Instructions for Neon branch restore
    `)
}

export { backupDatabase, restoreFromBackup, restoreFromNeonBranch }