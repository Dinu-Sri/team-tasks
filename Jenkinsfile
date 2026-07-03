pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  parameters {
    booleanParam(name: 'RUN_DOCKER_BUILD', defaultValue: true, description: 'Build the Tuduvia Docker image after checks pass.')
    booleanParam(name: 'PUSH_IMAGE', defaultValue: false, description: 'Push the image to GHCR. Requires ghcr-token Jenkins credentials.')
    string(name: 'IMAGE_NAME', defaultValue: 'ghcr.io/dinu-sri/team-tasks-app', description: 'Docker image repository.')
    string(name: 'GHCR_CREDENTIALS_ID', defaultValue: 'ghcr-token', description: 'Jenkins credentials ID for GHCR.')
  }

  environment {
    NODE_IMAGE = 'node:20-alpine'
    NEXT_TELEMETRY_DISABLED = '1'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.SHORT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
          env.IMAGE_TAG = "${params.IMAGE_NAME}:${env.SHORT_SHA}"
        }
      }
    }

    stage('Install + Typecheck') {
      steps {
        sh '''
          docker run --rm \
            --volumes-from jenkins \
            -w "$WORKSPACE" \
            -e NEXT_TELEMETRY_DISABLED=1 \
            "$NODE_IMAGE" \
            sh -lc "corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm install --frozen-lockfile && pnpm run typecheck"
        '''
      }
    }

    stage('Docker Build') {
      when {
        expression { return params.RUN_DOCKER_BUILD }
      }
      steps {
        sh '''
          docker build \
            -t "$IMAGE_TAG" \
            -t "$IMAGE_NAME:jenkins-latest" \
            .
        '''
      }
    }

    stage('Push Image') {
      when {
        expression { return params.PUSH_IMAGE }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: params.GHCR_CREDENTIALS_ID, usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_TOKEN')]) {
          sh '''
            echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
            docker push "$IMAGE_TAG"
            docker push "$IMAGE_NAME:jenkins-latest"
          '''
        }
      }
    }

    stage('Staging Deploy Placeholder') {
      steps {
        echo 'Next phase: deploy IMAGE_TAG to stage.tuduvia.com after staging stack is ready.'
      }
    }

    stage('Production Approval Placeholder') {
      when {
        branch 'master'
      }
      steps {
        echo 'Next phase: add manual approval before production deployment.'
      }
    }
  }

  post {
    success {
      echo "Tuduvia pipeline completed successfully for ${env.SHORT_SHA}."
    }
    failure {
      echo 'Tuduvia pipeline failed. Check the failed stage above.'
    }
  }
}
