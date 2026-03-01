pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "📥 Pulling latest code"
                checkout scm
            }
        }

        stage('Docker Sanity Check') {
            steps {
                sh '''
                docker --version
                docker compose version
                '''
            }
        }

        stage('Stop Old Containers') {
            steps {
                echo "🛑 Stopping existing containers"
                sh '''
                docker compose down || true
                '''
            }
        }

        stage('Build Frontend & Backend (NO CACHE)') {
            steps {
                echo "🏗️ Rebuilding frontend & backend images"
                sh '''
                docker compose build --no-cache frontend backend
                '''
            }
        }

        stage('Start Containers') {
            steps {
                echo "🚀 Deploying updated containers"
                sh '''
                docker compose up -d
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                echo "🔍 Verifying running containers"
                sh '''
                docker ps
                '''
            }
        }
    }

    post {
        success {
            echo "✅ CI/CD SUCCESS – Frontend & Backend updated"
        }
        failure {
            echo "❌ CI/CD FAILED – Check logs above"
        }
        always {
            echo "📄 Pipeline finished"
        }
    }
}
