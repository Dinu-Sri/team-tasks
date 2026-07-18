pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
    // Long docker/next builds were dying mid-step after Jenkins restarts
    // (JENKINS-48300 durable-task heartbeat). Prefer promote over rebuild.
  }

  parameters {
    booleanParam(name: 'RUN_DOCKER_BUILD', defaultValue: true, description: 'Promote or rebuild the Tuduvia Docker image after checks pass.')
    booleanParam(name: 'FULL_REBUILD', defaultValue: false, description: 'If true, rebuild the image on the VPS with docker build. Default false: pull the GitHub Actions image and retag (avoids long next build interruptions).')
    booleanParam(name: 'PUSH_IMAGE', defaultValue: true, description: 'Push the image to GHCR. Requires ghcr-token Jenkins credentials.')
    booleanParam(name: 'DEPLOY_STAGING', defaultValue: true, description: 'Redeploy the Tuduvia staging stack after the image is pushed.')
    booleanParam(name: 'RUN_TYPECHECK', defaultValue: true, description: 'Run pnpm typecheck in a Node container before promote/push.')
    string(name: 'IMAGE_NAME', defaultValue: 'ghcr.io/dinu-sri/team-tasks-app', description: 'Docker image repository.')
    string(name: 'GHCR_CREDENTIALS_ID', defaultValue: 'ghcr-token', description: 'Jenkins credentials ID for GHCR.')
    string(name: 'PORTAINER_URL', defaultValue: 'https://109.199.125.98:9443', description: 'Portainer base URL for staging redeploy.')
    string(name: 'PORTAINER_CREDENTIALS_ID', defaultValue: 'portainer-api-token', description: 'Jenkins secret text credential ID for the Portainer API token.')
    string(name: 'STAGING_STACK_ID', defaultValue: '68', description: 'Portainer stack ID for tuduvia-staging.')
    string(name: 'STAGING_ENDPOINT_ID', defaultValue: '3', description: 'Portainer endpoint/environment ID for tuduvia-staging.')
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
          env.FULL_SHA = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
          env.IMAGE_TAG = "${params.IMAGE_NAME}:${env.SHORT_SHA}"
          env.SOURCE_IMAGE_SHA = "${params.IMAGE_NAME}:${env.FULL_SHA}"
          env.SOURCE_IMAGE_LATEST = "${params.IMAGE_NAME}:latest"
        }
      }
    }

    stage('Install + Typecheck') {
      when {
        expression { return params.RUN_TYPECHECK }
      }
      steps {
        sh '''
          docker run --rm \
            --volumes-from jenkins \
            -w "$WORKSPACE" \
            -e NEXT_TELEMETRY_DISABLED=1 \
            "$NODE_IMAGE" \
            sh -lc "corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm run typecheck"
        '''
      }
    }

    stage('Promote GHA Image') {
      when {
        expression { return params.RUN_DOCKER_BUILD && !params.FULL_REBUILD }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: params.GHCR_CREDENTIALS_ID, usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_TOKEN')]) {
          sh '''
            set -euo pipefail
            echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

            # Prefer the exact commit image published by GitHub Actions.
            # Fall back to :latest if the SHA tag is not available yet.
            if docker pull "$SOURCE_IMAGE_SHA"; then
              SOURCE="$SOURCE_IMAGE_SHA"
              echo "Promoting exact commit image: $SOURCE"
            else
              echo "SHA tag not found; falling back to $SOURCE_IMAGE_LATEST"
              docker pull "$SOURCE_IMAGE_LATEST"
              SOURCE="$SOURCE_IMAGE_LATEST"
            fi

            docker tag "$SOURCE" "$IMAGE_TAG"
            docker tag "$SOURCE" "$IMAGE_NAME:jenkins-latest"
            echo "Tagged $SOURCE as $IMAGE_TAG and $IMAGE_NAME:jenkins-latest"
          '''
        }
      }
    }

    stage('Docker Build (full rebuild)') {
      when {
        expression { return params.RUN_DOCKER_BUILD && params.FULL_REBUILD }
      }
      steps {
        sh '''
          set -euo pipefail
          docker build \
            -t "$IMAGE_TAG" \
            -t "$IMAGE_NAME:jenkins-latest" \
            .
        '''
      }
    }

    stage('Push Image') {
      when {
        expression { return params.PUSH_IMAGE && params.RUN_DOCKER_BUILD }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: params.GHCR_CREDENTIALS_ID, usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_TOKEN')]) {
          sh '''
            set -euo pipefail
            echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
            docker push "$IMAGE_TAG"
            docker push "$IMAGE_NAME:jenkins-latest"
          '''
        }
      }
    }

    stage('Deploy Staging') {
      when {
        expression { return params.RUN_DOCKER_BUILD && params.PUSH_IMAGE && params.DEPLOY_STAGING }
      }
      steps {
        echo 'Staging image pushed. Watchtower will pull ghcr.io/dinu-sri/team-tasks-app:jenkins-latest and recreate tuduvia-staging.'
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
      echo 'If the log mentions Jenkins restart / durable-task heartbeat, keep FULL_REBUILD=false so Jenkins only promotes the GHA image.'
    }
  }
}
