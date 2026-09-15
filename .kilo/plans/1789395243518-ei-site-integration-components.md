# EI Site Integration Components

## Scope
Describe systems, technologies, and software components that can be integrated into an **EI site** to enhance functionality and efficiency. "EI site" is interpreted as both **Electronic Intelligence (ELINT/SIGINT)** collection sites and **Enterprise Integration** environments (including defense hybrid contexts).

## Electronic Intelligence (ELINT/SIGINT) Sites

- **Wideband RF receivers / SDR platforms**: Ettus USRP, ADALM-Pluto, RTL-SDR for broad spectrum capture
- **Antenna arrays & DF systems**: Direction-finding arrays for geolocation triangulation of emitters
- **IFM receivers**: Instantaneous frequency measurement for multi-signal detection and PRI estimation
- **Digital down-converters (DDC)**: Convert RF to baseband for further processing
- **FPGAs**: Xilinx/Intel for real-time signal processing pipelines
- **Pulse Doppler processors**: Radar signal analysis; extract PRF, pulse width, Doppler shifts
- **ELINT Data Processors (EDPs)**: GNU Radio, commercial suites (Parsons) for automated signal analysis
- **Sensor fusion engines**: Combine SIGINT/GEOINT/MASINT into unified operational picture
- **Database systems**: PostgreSQL+PostGIS (geospatial), TimescaleDB (time-series), Apache Druid (high-ingest telemetry)
- **Message queues**: Kafka, RabbitMQ for high-throughput, fault-tolerant data transport between sensors and analysis nodes
- **Stream processors**: Apache Flink, Spark Streaming for real-time emitter track correlation, de-dup, track initiation
- **Search/indexing systems**: Elasticsearch/Solr for retrospective signal query and pattern analysis
- **ML model serving platforms**: TensorFlow Serving, KServe for modulation classification and threat recognition
- **Anomaly detection systems**: Isolation forests, autoencoders for novel/hopping emitter detection
- **Knowledge graphs**: Neo4j, Neptune for actor-emitter-platform link analysis
- **COMINT extensions**: Voice-to-text ASR (Whisper/Vosk) for keyword spotting; traffic analysis for metadata extraction; cipher identification engines

## Enterprise Integration Sites

- **ESB / iPaaS platforms**: MuleSoft Anypoint, IBM Integration Bus, Apache Camel; Workato, Boomi, Power Platform
- **API Management gateways**: Apigee, Kong, Azure API Management — exposure, rate limiting, security
- **Message brokers**: Kafka (streaming), RabbitMQ/ActiveMQ (queue-based), AWS SQS/SNS
- **Data integration tools**: Informatica, Talend, Fivetran — ETL/ELT pipelines to data warehouses
- **Identity federation**: SAML, OAuth 2.0, OIDC via Okta, Azure AD, Keycloak
- **Event-driven architecture (EDA)**: Schema registries, webhook management, CDC connectors
- **Distributed tracing**: Jaeger, Zipkin, AWS X-Ray — cross-system visibility
- **API analytics/monitoring**: Prometheus+Grafana, Datadog, New Relic for SLA tracking
- **Master Data Management (MDM)**: Reltio, Informatica MDM for single source of truth
- **Zero Trust / SASE**: Gateways for secure cloud/remote system integration
- **DLP platforms**: Microsoft Purview, Symantec DLP scanning data in motion
- **Data masking services**: Delphix, IBM Optim for PII protection in integrated datasets
- **Blockchain anchors**: Tamper-proof audit trails of integration events
- **Hybrid defense**: Cross-domain solutions (CDS), DoD PKI, SIPRNET/DTS integration tools

## Open Questions
None — this is a reference document, not an implementation plan.
