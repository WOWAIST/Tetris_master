# Codex Project Prompt Template

## 한 줄 설명

테트리스 입문자를 위한 테트리스 연습 웹앱.
기능은 초급과 중급 코스로 나뉜다.

초급 : 단축키 연습 

```
왼쪽 이동 (Move Left)      : Left Arrow (←)
오른쪽 이동 (Move Right)   : Right Arrow (→)
소프트 드랍 (Soft Drop)    : Down Arrow (↓)
하드 드랍 (Hard Drop)      : Space

반시계 회전 (CCW)          : Z
시계 회전 (CW)             : X
180도 회전                 : A

홀드 (Hold)                : C
```
중급 : T자 회전 등 연습 


```md
## 프로젝트 기본값
- 배포 브랜치: `main`
- CI 브랜치: `develop`, `main`

아래 placeholder는 다음 값으로 치환해서 프로젝트를 생성해줘.

{{PROJECT_NAME}} = tetrisMaster
{{BASE_PACKAGE}} = com.tetrisMaster/tetrisMaster
{{BASE_PACKAGE_AS_PATH}} = com/tetrisMaster/tetrisMaster
{{DATABASE_NAME}} =  tetris
{{RAILWAY_SERVICE_NAME}} =  tetrisMaster
{{APPLICATION_CLASS_NAME}} = TetrisMasterApplication


## 한 줄 설명
{{PROJECT_DESCRIPTION}} = "테스트 용입니다."

## 기술 스택

- Frontend: Vite + Vanilla JavaScript ES6+, CSS
- Backend: Java 21, Spring Boot 3.4.3, Spring Web, Spring Data JPA, Validation
- DB: MySQL 8.0, database `{{DATABASE_NAME}}`, Hibernate `ddl-auto=update`
- Deployment: Railway 단일 서비스 배포
- Builder: Railpack, Gradle 9.x 지원 필요
- Runtime: Spring Boot jar 하나가 API와 프론트 정적 파일을 함께 서빙

## 목표 구조

다음 구조로 프로젝트를 만들어줘.

```text
.
├── backend
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradlew
│   ├── gradle/wrapper/...
│   └── src
│       ├── main
│       │   ├── java/{{BASE_PACKAGE_AS_PATH}}
│       │   │   ├── {{APPLICATION_CLASS_NAME}}.java
│       │   │   ├── config
│       │   │   │   └── CorsConfig.java
│       │   │   └── ...
│       │   └── resources
│       │       └── application.yaml
│       └── test
│           ├── java/{{BASE_PACKAGE_AS_PATH}}/{{APPLICATION_CLASS_NAME}}Tests.java
│           └── resources/application.yaml
├── frontend
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   └── src
│       ├── main.js
│       └── styles.css
├── .github
│   └── workflows
│       ├── ci.yml
│       └── cd.yml
├── railway.json
├── .env
├── .gitignore
└── docs
    └── railway-deploy.md
```

## Backend 요구사항

`backend`는 Spring Boot 프로젝트로 구성한다.

- Java 21
- Spring Boot `3.4.3`
- Gradle wrapper 사용
- 의존성:
  - `spring-boot-starter-web`
  - `spring-boot-starter-data-jpa`
  - `spring-boot-starter-validation`
  - `mysql-connector-j`
  - `lombok`
  - test: `spring-boot-starter-test`, `h2`
- `settings.gradle`의 root project name은 `{{PROJECT_NAME}}`
- jar 이름은 기본 Gradle 산출물인 `{{PROJECT_NAME}}-0.0.1-SNAPSHOT.jar` 기준으로 둔다.

`backend/src/main/resources/application.yaml`은 아래 정책으로 작성한다.


```yaml
spring:
  application:
    name: {{PROJECT_NAME}}

  datasource:
    url: jdbc:mysql://${MYSQL_HOST:${MYSQLHOST:localhost}}:${MYSQL_PORT:${MYSQLPORT:3306}}/${MYSQL_DATABASE:${MYSQLDATABASE:woowa_weekly}}?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useSSL=false&allowPublicKeyRetrieval=true
    username: ${MYSQL_USER:${MYSQLUSER}}
    password: ${MYSQL_PASSWORD:${MYSQLPASSWORD}}
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    open-in-view: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true
        jdbc:
          time_zone: Asia/Seoul

server:
  port: ${PORT:8080}

github:
  api-url: https://api.github.com
  token: ${GITHUB_TOKEN:}

```


.env에는 아래의 변수들을 작성한다.

```env
MYSQLHOST=
MYSQLPORT=
MYSQLDATABASE=
MYSQLUSER=
MYSQLPASSWORD=
GITHUB_TOKEN=아직임시값
```

## Frontend 요구사항

`frontend`는 Vite + Vanilla JavaScript로 구성한다.
`frontend/package.json`:

```json
{
  "name": "{{PROJECT_NAME}}-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "vite build",
    "start": "vite preview --host 0.0.0.0 --port ${PORT:-4173}",
    "preview": "vite preview --host 127.0.0.1"
  },
  "dependencies": {
    "vite": "^7.1.0"
  },
  "devDependencies": {}
}
```


## 프론트 정적 파일 패키징
Railway는 단일 서비스로 배포한다. 프론트와 백엔드를 별도 서비스로 나누지 않는다.
루트 `railway.json`의 build command에서 다음 순서로 실행한다.

1. `frontend`에서 `npm ci`
2. `frontend`에서 `npm run build`
3. `backend`에서 `./gradlew clean bootJar`

`backend/build.gradle`에는 `frontend/dist`를 Spring Boot jar 안의 static resource로 복사하는 작업을 둔다.

```gradle
def frontendDistDir = file("${rootDir}/../frontend/dist")

tasks.register('copyFrontend', Copy) {
	from frontendDistDir
	into layout.buildDirectory.dir('resources/main/static')
	onlyIf {
		frontendDistDir.exists()
	}
}

tasks.named('processResources') {
	dependsOn 'copyFrontend'
}
```

## Railway 설정

루트에 `railway.json`을 둔다.

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "cd frontend && npm ci && npm run build && cd ../backend && ./gradlew clean bootJar"
  },
  "deploy": {
    "startCommand": "java -jar backend/build/libs/{{PROJECT_NAME}}-0.0.1-SNAPSHOT.jar",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## GitHub Actions CI

`.github/workflows/ci.yml`을 만든다.

```yaml
name: CI

on:
  push:
    branches:
      - develop

  pull_request:
    branches:
      - develop
      - main

jobs:
  frontend-ci:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npm run build

  backend-ci:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - run: chmod +x gradlew
      - run: ./gradlew build
```

## GitHub Actions CD

`.github/workflows/cd.yml`을 만든다.
- {{PROJECT_NAME}}에는 위에서 지정한 값을 넣어준다.

```yaml
name: Deploy

on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # frontend build
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build Frontend
        working-directory: frontend
        run: |
          npm ci
          npm run build

      # frontend -> spring static
      - name: Copy Frontend Build
        run: |
          rm -rf backend/src/main/resources/static/*
          mkdir -p backend/src/main/resources/static
          cp -r frontend/dist/* backend/src/main/resources/static/

      # backend build
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - name: Build Backend
        working-directory: backend
        run: |
          chmod +x gradlew
          ./gradlew build

      # railway deploy
      - name: Deploy Railway
        run: npx @railway/cli up --service {{PROJECT_NAME}}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```
