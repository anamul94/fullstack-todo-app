FROM postgres:16-alpine

# Set environment variables for the database
ENV POSTGRES_USER=tododbuser
ENV POSTGRES_PASSWORD=@palabona
ENV POSTGRES_DB=tododb

VOLUME ["/var/lib/postgresql/data"]

# Expose the default PostgreSQL port
EXPOSE 5432

# Map the PostgreSQL port to the host
