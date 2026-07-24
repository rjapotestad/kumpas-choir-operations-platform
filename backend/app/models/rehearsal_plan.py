from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RehearsalPlan(Base):
    __tablename__ = "rehearsal_plans"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    title = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    items = relationship("RehearsalPlanItem", back_populates="plan", cascade="all, delete-orphan")


class RehearsalPlanItem(Base):
    __tablename__ = "rehearsal_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    rehearsal_plan_id = Column(Integer, ForeignKey("rehearsal_plans.id"), nullable=False)
    song_id = Column(Integer, ForeignKey("songs.id"), nullable=False)
    start_time = Column(String, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    order_index = Column(Integer, nullable=False)

    plan = relationship("RehearsalPlan", back_populates="items")
    song = relationship("Song")