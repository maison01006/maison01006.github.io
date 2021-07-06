---
title: "Elasticsearch"
date: 2021-07-06
categories: Elasticsearch
---

# Elasticsearch

### 설치방법

```bash
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.13.2-amd64.deb
```

```bash
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.13.2-arm64.deb
```

### 데몬 실행

```bash
$ sudo systemctl start elasticsearch.service
$ sudo systemctl status elasticsearch.service
```

### 설정

```bash
$ sudo vi /etc/elasticsearch/elasticsearch.yml
```

### 명령어

classes 만들기

```bash
curl -XPUT localhost:9200/classes
```

classes 지우기

```bash
curl -XDELETE localhost:9200/classes
```

데이터 삽입

```bash
curl -XPOST -H "Content-Type: application/json" localhost:9200 -d '{"title":"Algorithm","professor":"John"}'
```

여러 데이터 삽입

```bash
curl -XPOST localhost:9200/classes/class/1/ -d @json파일
```

많은 양의 도큐먼트를 삽입 (여러 테이블의 데이터 삽입)

```bash
curl -XPOST localhost:9200/_bulk --data-binary @json파일
```

매핑 하기 ( 스키마 작성 )

```bash
curl -XPUT localhost:9200/classes/class/_mapping -d @mapping json파일
```

출력

```bash
curl -XGET localhost:9200/classes/class/_search?q=points:30
```

메트릭 어그리게이션

```bash
curl -XGET localhost:9200/_search?pretty --data-binary @json파일
```

