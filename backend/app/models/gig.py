from sqlalchemy import Column, Integer, String, Date
from app.database import Base

class Gig(Base):
    __tablename__ = "gigs"

    id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    venue = Column(String, nullable=True)
    performance_time = Column(String, nullable=True)  # "HH:MM"
    costume = Column(String, nullable=True)
    notes = Column(String, nullable=True)  # call time, soundcheck time, etc.
