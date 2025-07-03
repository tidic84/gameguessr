#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class TaskManager {
  constructor() {
    this.tasksFile = path.join(__dirname, 'PROJECT_TASKS.json');
    this.tasks = this.loadTasks();
  }

  loadTasks() {
    try {
      const data = fs.readFileSync(this.tasksFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      return null;
    }
  }

  saveTasks() {
    try {
      fs.writeFileSync(this.tasksFile, JSON.stringify(this.tasks, null, 2));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  }

  getStatusColor(status) {
    switch (status) {
      case 'completed': return colors.green;
      case 'in-progress': return colors.yellow;
      case 'pending': return colors.red;
      default: return colors.reset;
    }
  }

  getPriorityColor(priority) {
    switch (priority) {
      case 'critical': return colors.red;
      case 'high': return colors.magenta;
      case 'medium': return colors.yellow;
      case 'low': return colors.cyan;
      default: return colors.reset;
    }
  }

  displayProject() {
    const { projectInfo } = this.tasks;
    console.log(`\n${colors.bright}${colors.blue}=== ${projectInfo.name} ===${colors.reset}`);
    console.log(`Description: ${projectInfo.description}`);
    console.log(`Version: ${projectInfo.version}`);
    console.log(`Durée estimée: ${projectInfo.estimatedDuration}`);
    console.log(`Date de début: ${projectInfo.startDate}\n`);
  }

  displayPhases() {
    console.log(`${colors.bright}${colors.cyan}PHASES DU PROJET${colors.reset}\n`);
    
    this.tasks.phases.forEach((phase, index) => {
      const statusColor = this.getStatusColor(phase.status);
      const completedTasks = phase.tasks.filter(t => t.status === 'completed').length;
      const totalTasks = phase.tasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      console.log(`${index + 1}. ${colors.bright}${phase.title}${colors.reset}`);
      console.log(`   Status: ${statusColor}${phase.status}${colors.reset}`);
      console.log(`   Durée: ${phase.estimatedDuration}`);
      console.log(`   Progression: ${progress}% (${completedTasks}/${totalTasks} tâches)`);
      console.log(`   ${phase.description}\n`);
    });
  }

  displayCurrentPhase() {
    const currentPhase = this.tasks.phases.find(p => p.id === this.tasks.currentPhase);
    if (!currentPhase) return;

    console.log(`${colors.bright}${colors.green}PHASE ACTUELLE: ${currentPhase.title}${colors.reset}\n`);
    
    currentPhase.tasks.forEach((task, index) => {
      const statusColor = this.getStatusColor(task.status);
      const priorityColor = this.getPriorityColor(task.priority);
      
      console.log(`${index + 1}. ${colors.bright}${task.title}${colors.reset}`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Status: ${statusColor}${task.status}${colors.reset}`);
      console.log(`   Priorité: ${priorityColor}${task.priority}${colors.reset}`);
      console.log(`   Temps estimé: ${task.estimatedHours}h`);
      console.log(`   ${task.description}`);
      
      if (task.dependencies.length > 0) {
        console.log(`   Dépendances: ${task.dependencies.join(', ')}`);
      }
      
      if (task.subtasks && task.subtasks.length > 0) {
        console.log(`   Sous-tâches:`);
        task.subtasks.forEach(subtask => {
          console.log(`     • ${subtask}`);
        });
      }
      console.log('');
    });
  }

  displayNextActions() {
    console.log(`${colors.bright}${colors.yellow}PROCHAINES ACTIONS${colors.reset}\n`);
    this.tasks.nextActions.forEach((action, index) => {
      console.log(`${index + 1}. ${action}`);
    });
    console.log('');
  }

  updateTaskStatus(taskId, newStatus) {
    let taskFound = false;
    
    this.tasks.phases.forEach(phase => {
      phase.tasks.forEach(task => {
        if (task.id === taskId) {
          task.status = newStatus;
          taskFound = true;
          console.log(`✅ Tâche ${taskId} mise à jour: ${newStatus}`);
        }
      });
    });

    if (!taskFound) {
      console.log(`❌ Tâche ${taskId} non trouvée`);
      return false;
    }

    return this.saveTasks();
  }

  listTasksForStatus(status) {
    console.log(`${colors.bright}Tâches avec le status "${status}":${colors.reset}\n`);
    
    this.tasks.phases.forEach(phase => {
      const filteredTasks = phase.tasks.filter(task => task.status === status);
      if (filteredTasks.length > 0) {
        console.log(`${colors.cyan}${phase.title}${colors.reset}`);
        filteredTasks.forEach(task => {
          const priorityColor = this.getPriorityColor(task.priority);
          console.log(`  • ${task.id}: ${task.title} (${priorityColor}${task.priority}${colors.reset}, ${task.estimatedHours}h)`);
        });
        console.log('');
      }
    });
  }

  showStats() {
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let pendingTasks = 0;
    let totalHours = 0;
    let completedHours = 0;

    this.tasks.phases.forEach(phase => {
      phase.tasks.forEach(task => {
        totalTasks++;
        totalHours += task.estimatedHours;
        
        switch (task.status) {
          case 'completed':
            completedTasks++;
            completedHours += task.estimatedHours;
            break;
          case 'in-progress':
            inProgressTasks++;
            break;
          case 'pending':
            pendingTasks++;
            break;
        }
      });
    });

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const timeProgress = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

    console.log(`${colors.bright}${colors.blue}STATISTIQUES DU PROJET${colors.reset}\n`);
    console.log(`Progression globale: ${progress}% (${completedTasks}/${totalTasks} tâches)`);
    console.log(`Temps: ${timeProgress}% (${completedHours}h/${totalHours}h)`);
    console.log(`${colors.green}Terminées: ${completedTasks}${colors.reset}`);
    console.log(`${colors.yellow}En cours: ${inProgressTasks}${colors.reset}`);
    console.log(`${colors.red}En attente: ${pendingTasks}${colors.reset}\n`);
  }
}

// CLI
const taskManager = new TaskManager();
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
  case 'overview':
    taskManager.displayProject();
    taskManager.displayPhases();
    break;
  
  case 'current':
    taskManager.displayCurrentPhase();
    break;
  
  case 'next':
    taskManager.displayNextActions();
    break;
  
  case 'update':
    if (arg1 && arg2) {
      taskManager.updateTaskStatus(arg1, arg2);
    } else {
      console.log('Usage: node tasks.js update <task-id> <status>');
      console.log('Status possibles: pending, in-progress, completed');
    }
    break;
  
  case 'status':
    if (arg1) {
      taskManager.listTasksForStatus(arg1);
    } else {
      console.log('Usage: node tasks.js status <status>');
      console.log('Status possibles: pending, in-progress, completed');
    }
    break;
  
  case 'stats':
    taskManager.showStats();
    break;
  
  default:
    console.log(`${colors.bright}${colors.cyan}GameGuessr Task Manager${colors.reset}\n`);
    console.log('Commandes disponibles:');
    console.log('  overview  - Vue d\'ensemble des phases');
    console.log('  current   - Afficher la phase actuelle');
    console.log('  next      - Afficher les prochaines actions');
    console.log('  update    - Mettre à jour le status d\'une tâche');
    console.log('  status    - Lister les tâches par status');
    console.log('  stats     - Afficher les statistiques');
    console.log('\nExemples:');
    console.log('  node tasks.js overview');
    console.log('  node tasks.js update task-1-1 in-progress');
    console.log('  node tasks.js status pending');
    break;
}
