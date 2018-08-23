#ifndef __STEPPER_H__
#define __STEPPER_H__

#include <stdexcept>

#include "./Physics.h"

int func(double t, const double y[], double f[], void *params) {
  (void)(t); /* avoid unused parameter warning */
  Physics::get_derivatives(*(const Dipole*)(y), f);
  return GSL_SUCCESS;
}

int jac(double t, const double y[], double *dfdy, double dfdt[], void *params) {
  (void)(t); /* avoid unused parameter warning */
  Physics::get_jacobian(*(const Dipole*)(y), dfdy);
  for (int i = 0; i < 6; ++i) {
    dfdt[i] = 0.0;
  }
  return GSL_SUCCESS;
}

class Stepper {
 public:
  Stepper(const Dipole& freeDipole, const double h_, const bool fixed_h_,
          const double eps_abs_) :
      d0(freeDipole), d(freeDipole), eps_abs(eps_abs_), eps_rel(0),
      a_y(1), a_dydt(0), t1(1e100),
      t(0), h(h_), _fixed_h(fixed_h_) {

    const gsl_odeiv2_step_type* step_type = gsl_odeiv2_step_rk8pd;
    // const gsl_odeiv2_step_type* step_type = gsl_odeiv2_step_bsimp;
 
    sys = { func, jac, 6, 0 };

    _step = gsl_odeiv2_step_alloc(step_type, 6);
    control = gsl_odeiv2_control_standard_new(eps_abs, eps_rel, a_y, a_dydt);
    evolve = gsl_odeiv2_evolve_alloc(6);
  }

  ~Stepper() {
    gsl_odeiv2_evolve_free (evolve);
    gsl_odeiv2_control_free (control);
    gsl_odeiv2_step_free(_step);
  }

  void step() {
    doStep(false);
  }

  void stepHalf() {
    if (_fixed_h) {
      throw std::logic_error("No binary searching when using a fixed step size.");
    }
    h = h/2;
    doStep(true);
  }

  // Backup one step 
  void undo() {
    d = d0;
    // t = t0;
    h = h0;
    reset();
  }

  void reset() {
    gsl_odeiv2_step_reset(_step);
    gsl_odeiv2_evolve_reset(evolve);
  }

 private:
  void doStep(const bool fixed) {
    d0 = d;
    t0 = t;
    h0 = h;

    // d and y are linked!
    double* y = (double*)(&d);
    int status;
    if (fixed || _fixed_h) {
      status = gsl_odeiv2_evolve_apply_fixed_step(
          evolve, control, _step, &sys, &t, h, y);
    } else {
      status = gsl_odeiv2_evolve_apply(
          evolve, control, _step, &sys, &t, t1, &h, y);
    }
    if (status != GSL_SUCCESS) {
      printf ("Error: %s\n", gsl_strerror(status));
      throw std::logic_error(gsl_strerror(status));
    }
  }

 public:
  Dipole d;
  double t;
  double h;

 private:
  gsl_odeiv2_system sys;
  gsl_odeiv2_step* _step;
  gsl_odeiv2_control* control;
  gsl_odeiv2_evolve* evolve;
  const bool _fixed_h;
  const double eps_abs;
  const double eps_rel;
  const double a_y;
  const double a_dydt;
  const double t1;
  
  // backups
  Dipole d0;
  double t0;
  double h0;
};

#endif
