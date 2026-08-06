from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
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

    items = relationship("GigItem", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", cascade="all, delete-orphan")


class GigItem(Base):
    __tablename__ = "gig_items"

    id = Column(Integer, primary_key=True, index=True)
    gig_id = Column(Integer, ForeignKey("gigs.id"), nullable=False)
    song_id = Column(Integer, ForeignKey("songs.id"), nullable=False)
    order_index = Column(Integer, nullable=False)

    song = relationship("Song")
